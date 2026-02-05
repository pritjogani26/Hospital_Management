CREATE TABLE IF NOT EXISTS patients (
    patient_id SERIAL PRIMARY KEY,
    patient_name VARCHAR(50) NOT NULL,
    dob DATE NOT NULL,
    email VARCHAR(100) UNIQUE,
    mobile VARCHAR(15),
    gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
    blood_group VARCHAR(5),
    address TEXT,
    profile_image VARCHAR(255),
    status CHAR(1) NOT NULL DEFAULT 'A' CHECK (status IN ('A', 'D')),
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by INTEGER NOT NULL,
    updated_at TIMESTAMPTZ,
    updated_by INTEGER,
    update_reason VARCHAR(100)
);

CREATE OR REPLACE FUNCTION create_patient(
    p_patient_name VARCHAR,
    p_dob DATE,
    p_email VARCHAR,
    p_mobile VARCHAR,
    p_gender CHAR,
    p_blood_group VARCHAR,
    p_address TEXT,
    p_profile_image VARCHAR,
    p_created_by INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_patient_id INTEGER;
BEGIN
    -- Email uniqueness check (only if email provided)
    IF p_email IS NOT NULL AND EXISTS (
        SELECT 1 FROM patients
        WHERE email = p_email
    ) THEN
        RETURN -1; -- Email already exists
    END IF;

    INSERT INTO patients (
        patient_name,
        dob,
        email,
        mobile,
        gender,
        blood_group,
        address,
        profile_image,
        created_by
    )
    VALUES (
        p_patient_name,
        p_dob,
        p_email,
        p_mobile,
        p_gender,
        p_blood_group,
        p_address,
        COALESCE(p_profile_image, '/media/defaults/patient.png'),
        p_created_by
    )
    RETURNING patient_id INTO v_patient_id;

    RETURN v_patient_id; -- Success
END;
$$;


CREATE OR REPLACE FUNCTION count_display_patients(
    p_query TEXT,
    p_category VARCHAR
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count
    FROM patients p
    WHERE (
        p_category IS NULL
        OR p_category = ''
        OR p_category = 'all'
        OR p.status = p_category
    )
    AND (
        p_query IS NULL
        OR p_query = ''
        OR p.patient_id::TEXT LIKE p_query || '%'
        OR p.patient_name ILIKE '%' || p_query || '%'
        OR COALESCE(p.email, '') ILIKE '%' || p_query || '%'
    );

    RETURN total_count;
END;
$$;

CREATE OR REPLACE FUNCTION display_patients(
    p_query TEXT,
    p_category VARCHAR,
    p_limit INTEGER,
    p_offset INTEGER
)
RETURNS TABLE (
    patient_id INTEGER,
    patient_name VARCHAR,
    email VARCHAR,
    mobile VARCHAR,
    gender CHAR,
    status CHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.patient_id,
        p.patient_name,
        p.email,
        p.mobile,
        p.gender,
        p.status
    FROM patients p
    WHERE (
        p_category IS NULL
        OR p_category = ''
        OR p_category = 'all'
        OR p.status = p_category
    )
    AND (
        p_query IS NULL
        OR p_query = ''
        OR p.patient_id::TEXT LIKE '%' || p_query || '%'
        OR p.patient_name ILIKE '%' || p_query || '%'
        OR COALESCE(p.email, '') ILIKE '%' || p_query || '%'
    )
    ORDER BY p.patient_id
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


CREATE OR REPLACE FUNCTION display_single_patient(
    p_patient_id INTEGER
)
RETURNS TABLE (
    patient_id INTEGER,
    patient_name VARCHAR,
    dob DATE,
    email VARCHAR,
    mobile VARCHAR,
    gender CHAR,
    blood_group VARCHAR,
    address TEXT,
    profile_image VARCHAR,
    status CHAR,
    created_at TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP,
    updated_by INTEGER,
    update_reason VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.patient_id,
        p.patient_name,
        p.dob,
        p.email,
        p.mobile,
        p.gender,
        p.blood_group,
        p.address,
        p.profile_image,
        p.status,
        p.created_at,
        p.created_by,
        p.updated_at,
        p.updated_by,
        p.update_reason
    FROM patients p
    WHERE p.patient_id = p_patient_id;
END;
$$;


CREATE OR REPLACE FUNCTION soft_delete_patient(
    p_patient_id INTEGER,
    p_update_reason VARCHAR,
    p_updated_by INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM patients
        WHERE patient_id = p_patient_id
        AND status = 'A'
    ) THEN
        RETURN 0; -- Not found or already deleted
    END IF;

    UPDATE patients
    SET
        status = 'D',
        updated_at = CURRENT_TIMESTAMP,
        update_reason = p_update_reason,
        updated_by = p_updated_by
    WHERE patient_id = p_patient_id;

    RETURN 1; -- Success
END;
$$;


CREATE OR REPLACE FUNCTION update_patient(
    p_patient_id INTEGER,
    p_patient_name VARCHAR,
    p_dob DATE,
    p_email VARCHAR,
    p_mobile VARCHAR,
    p_gender CHAR,
    p_blood_group VARCHAR,
    p_address TEXT,
    p_profile_image VARCHAR,
    p_updated_by INTEGER,
    p_update_reason VARCHAR
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM patients
        WHERE patient_id = p_patient_id
        AND status = 'A'
    ) THEN
        RETURN -1;
    END IF;

    IF p_email IS NOT NULL AND EXISTS (
        SELECT 1 FROM patients
        WHERE email = p_email
        AND patient_id <> p_patient_id
    ) THEN
        RETURN -2;
    END IF;

    UPDATE patients
    SET
        patient_name = p_patient_name,
        dob = p_dob,
        email = p_email,
        mobile = p_mobile,
        gender = p_gender,
        blood_group = p_blood_group,
        address = p_address,
        profile_image = COALESCE(p_profile_image, profile_image),
        updated_at = CURRENT_TIMESTAMP,
        updated_by = p_updated_by,
        update_reason = p_update_reason
    WHERE patient_id = p_patient_id;

    RETURN p_patient_id; -- Success
END;
$$;