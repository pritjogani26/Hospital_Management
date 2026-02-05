drop function create_email_verification_token;
CREATE OR REPLACE FUNCTION create_email_verification_token(
    u_user_id INT,
    u_token TEXT,
    u_expires_at TIMESTAMPTZ
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE 
    inserted_token TEXT;
BEGIN
    UPDATE email_verification_table
    SET is_used = TRUE
    WHERE user_id = u_user_id AND is_used = FALSE;

    INSERT INTO email_verification_table (user_id, token, expires_at)
    VALUES (u_user_id, u_token, u_expires_at)
    RETURNING token into inserted_token;

    RETURN inserted_token;
END;
$$;



-- 2) verify_email
drop function verify_email;
CREATE OR REPLACE FUNCTION verify_email(u_token TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id INT;
    v_user_id INT;
BEGIN
    UPDATE email_verification_table
    SET is_used = TRUE
    WHERE token = u_token
      AND is_used = FALSE
      AND expires_at > now()
    RETURNING id, user_id INTO v_id, v_user_id;

    IF v_id IS NULL THEN
        RETURN -1;
    END IF;

    UPDATE users
    SET email_verified = TRUE
    WHERE user_id = v_user_id;

    RETURN 1;
END;
$$;



-- 3) register_user 
drop FUNCTION register_user;
CREATE OR REPLACE FUNCTION register_user_manual(
    u_first_name VARCHAR,
    u_last_name VARCHAR,
    u_email VARCHAR,
    u_mobile VARCHAR,
    u_password_hash TEXT,
    u_profile_image VARCHAR,
    u_role_id INT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE lower(email) = lower(u_email)) THEN
        RETURN -1;
    END IF;

    IF u_role_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM roles WHERE id = u_role_id) THEN
            RETURN -2;
        END IF;
    END IF;

    INSERT INTO users (email, email_verified, status, profile_image)
    VALUES (u_email, FALSE, 'ACTIVE', COALESCE(u_profile_image, '/media/defaults/patient.png'))
    RETURNING user_id INTO v_user_id;

    INSERT INTO user_profile (user_id, first_name, last_name, mobile)
    VALUES (v_user_id, u_first_name, u_last_name, u_mobile);

    INSERT INTO user_auth (user_id, auth_provider, provider_user_id, password_hash)
    VALUES (v_user_id, 'LOCAL', NULL, u_password_hash);

    IF u_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id)
        VALUES (v_user_id, u_role_id);
    END IF;

    RETURN v_user_id;
END;
$$;

drop FUNCTION register_user_auth_provider;
CREATE OR REPLACE FUNCTION register_user_auth_provider(
    u_first_name VARCHAR,
    u_last_name VARCHAR,
    u_email VARCHAR,
    u_mobile        VARCHAR,
    u_profile_image VARCHAR,
    u_role_id INT,
    v_auth_provider VARCHAR,
    v_provider_user_id  VARCHAR
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE lower(email) = lower(u_email)) THEN
        RETURN -1; -- Email already exists
    END IF;

    IF u_role_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM roles WHERE id = u_role_id) THEN
            RETURN -2;
        END IF;
    END IF;

    INSERT INTO users (email, email_verified, status, profile_image, last_login)
    VALUES (u_email, TRUE, 'ACTIVE', COALESCE(u_profile_image, '/media/defaults/patient.png'), now())
    RETURNING user_id INTO v_user_id;

    INSERT INTO user_profile (user_id, first_name, last_name, mobile)
    VALUES (v_user_id, u_first_name, u_last_name, NULL);

    INSERT INTO user_auth (user_id, auth_provider, provider_user_id, password_hash)
    VALUES (v_user_id, v_auth_provider, v_provider_user_id, NULL);

    IF u_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id)
        VALUES (v_user_id, u_role_id);
    END IF;

    RETURN v_user_id;
END;
$$;


drop FUNCTION store_refresh_token;
CREATE OR REPLACE FUNCTION store_refresh_token(
    u_user_id INT,
    u_refresh_token TEXT,
    u_expires_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE user_tokens
    SET is_revoked = TRUE
    WHERE user_id = u_user_id AND expires_at <= now();

    INSERT INTO user_tokens (user_id, refresh_token, expires_at)
    VALUES (u_user_id, u_refresh_token, u_expires_at);
END;
$$;

-- 5) get_refresh_token
drop FUNCTION get_refresh_token;
CREATE OR REPLACE FUNCTION get_refresh_token(u_refresh_token TEXT)
RETURNS TABLE (
    token_id INT,
    user_id INT,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT ut.token_id, ut.user_id, ut.expires_at
    FROM user_tokens ut
    WHERE ut.refresh_token = u_refresh_token
      AND ut.is_revoked = FALSE
      AND ut.expires_at > now();
END;
$$;

-- 6) revoke_token
drop FUNCTION revoke_token;
CREATE OR REPLACE FUNCTION revoke_token (u_refresh_token VARCHAR)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE user_tokens
    SET is_revoked = TRUE
    WHERE refresh_token = u_refresh_token;
END;
$$;

-- 7) user_check
drop FUNCTION user_check;
CREATE OR REPLACE FUNCTION user_check(u_email VARCHAR)
RETURNS INT
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = lower(u_email)) THEN
        RETURN -2; -- Email does not exist
    END IF;

    IF EXISTS (SELECT 1 FROM users WHERE lower(email) = lower(u_email) AND email_verified = FALSE) THEN
        RETURN -1; -- exists but not verified
    END IF;

    IF EXISTS (SELECT 1 FROM users WHERE lower(email) = lower(u_email) AND status <> 'ACTIVE') THEN
        RETURN -3; -- not active
    END IF;

    RETURN 1; -- OK
END;
$$;

-- 8) login_user
drop FUNCTION login_user;
CREATE OR REPLACE FUNCTION login_user(u_email VARCHAR)
RETURNS TABLE (
    user_id INT,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    mobile VARCHAR,
    profile_image VARCHAR,
    role_ids INT[],
    password_hash TEXT,
    status VARCHAR,
    email_verified BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id INT;
    v_pwd TEXT;
BEGIN
    SELECT u.user_id
    INTO v_user_id
    FROM users u
    WHERE lower(u.email) = lower(u_email)
      AND u.status = 'ACTIVE'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    SELECT ua.password_hash
    INTO v_pwd
    FROM user_auth ua
    WHERE ua.user_id = v_user_id
      AND ua.auth_provider = 'LOCAL'
    LIMIT 1;

    UPDATE users u
    SET last_login = now()
    WHERE u.user_id = v_user_id;

    RETURN QUERY
    SELECT
        u.user_id,
        up.first_name,
        up.last_name,
        u.email,
        up.mobile,
        u.profile_image,
        ARRAY(
            SELECT ur.role_id FROM user_roles ur WHERE ur.user_id = u.user_id
        ) AS role_ids,
        v_pwd AS password_hash,
        u.status,
        u.email_verified
    FROM users u
    LEFT JOIN user_profile up ON up.user_id = u.user_id
    WHERE u.user_id = v_user_id;
END;
$$;

-- 9) get_user_by_id
drop FUNCTION get_user_by_id;
CREATE OR REPLACE FUNCTION get_user_by_id(u_user_id INT)
RETURNS TABLE (
    user_id INT,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    mobile VARCHAR,
    profile_image VARCHAR,
    role_ids INT[],
    status VARCHAR,
    email_verified BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.user_id,
        up.first_name,
        up.last_name,
        u.email,
        up.mobile,
        u.profile_image,
        (SELECT array_agg(ur.role_id) from user_roles ur where ur.user_id = u.user_id) as role_ids,
        u.status,
        u.email_verified,
        u.created_at,
        up.updated_at,
        u.last_login
    FROM users u
    LEFT JOIN user_profile up ON up.user_id = u.user_id
    WHERE u.user_id = u_user_id;
END;
$$;


-- 10) change_password
drop FUNCTION change_password(u_user_id integer, u_password_hash text);
CREATE OR REPLACE FUNCTION change_password(
    u_user_id INT,
    u_password_hash TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM user_auth WHERE user_id = u_user_id AND auth_provider = 'LOCAL') THEN
        UPDATE user_auth
        SET password_hash = u_password_hash
        WHERE user_id = u_user_id AND auth_provider = 'LOCAL';
    ELSE
        INSERT INTO user_auth (user_id, auth_provider, provider_user_id, password_hash)
        VALUES (u_user_id, 'LOCAL', NULL, u_password_hash);
    END IF;

    UPDATE user_tokens
    SET is_revoked = TRUE
    WHERE user_id = u_user_id;
END;
$$;



-- 11) get_user_password_by_id
drop FUNCTION get_user_password_by_id;
CREATE OR REPLACE FUNCTION get_user_password_by_id(u_user_id INT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_password TEXT;
BEGIN
    SELECT password_hash INTO v_password
    FROM user_auth
    WHERE user_id = u_user_id
      AND auth_provider = 'LOCAL'
    LIMIT 1;

    RETURN v_password;
END;
$$;

drop FUNCTION mark_email_verified;
CREATE OR REPLACE FUNCTION mark_email_verified(p_user_id integer)
RETURNS void AS $$
BEGIN
    UPDATE users
    SET email_verified = TRUE
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;


drop FUNCTION update_profile;
CREATE OR REPLACE FUNCTION update_profile(
    u_user_id INT,
    u_first_name VARCHAR,
    u_last_name VARCHAR,
    u_mobile VARCHAR,
    u_profile_image VARCHAR
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users u
    SET profile_image = COALESCE(u_profile_image, u.profile_image)
    WHERE u.user_id = u_user_id;

    UPDATE user_profile up
    SET
        first_name = u_first_name,
        last_name = u_last_name,
        mobile = u_mobile,
        updated_at = now()
    WHERE up.user_id = u_user_id;

    RETURN 1;
END;
$$;




















SELECT
        u.user_id,
        up.first_name,
        up.last_name,
        u.email,
        up.mobile,
        u.profile_image,
        (SELECT array_agg(ur.role_id) from user_roles ur where ur.user_id = u.user_id) as role_ids,
        u.status,
        u.email_verified,
        ua.password_hash,
        u.status,
        ua.auth_provider,
        u.created_at,
        up.updated_at,
        u.last_login,
        up.updated_at,
        ua.provider_user_id
    FROM users u
    LEFT JOIN user_profile up ON up.user_id = u.user_id
    LEFT JOIN user_auth ua ON ua.user_id = u.user_id;

-- delete from users;
-- delete from user_auth;
-- DELETE from user_profile;
-- delete from user_roles;
-- delete from user_tokens;

select * from email_verification_table;

select * from user_auth;

