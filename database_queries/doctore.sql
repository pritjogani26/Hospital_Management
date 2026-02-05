CREATE TABLE genders (
    gender_id SERIAL PRIMARY KEY,
    gender_value VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

create OR REPLACE function get_genders()
RETURNS TABLE (
    gender_id INT,
    gender_value INT,
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.gender_id,
        g.gender_value
    FROM genders g
END;
$$ LANGUAGE plpgsql;


drop table qualifications;
CREATE TABLE qualifications (
    qualification_id SERIAL PRIMARY KEY,
    qualification_code VARCHAR(10) UNIQUE NOT NULL,
    qualification_name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

create OR REPLACE function get_qualifications()
RETURNS TABLE (
    qualification_id INT,
    qualification_code VARCHAR,
    qualification_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.qualification_id,
        q.qualification_code,
        q.qualification_name
    FROM qualifications q
    WHERE q.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

drop table doctors;
CREATE TABLE doctors (
    doctor_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    experience_years NUMERIC(4,2) NOT NULL CHECK (experience_years >= 0),
    gender_id INT REFERENCES genders(gender_id),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    consultation_fee NUMERIC(10,2),
    profile_image VARCHAR(255) DEFAULT '/media/defaults/patient.png',
    is_active BOOLEAN DEFAULT TRUE,
    joining_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

drop TABLE doctor_qualifications;
CREATE TABLE doctor_qualifications (
    doctor_qualification_id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    qualification_id INT NOT NULL REFERENCES qualifications(qualification_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (doctor_id, qualification_id)
);

INSERT INTO genders (gender_value)
VALUES ('Male'), ('Female'), ('Other');

INSERT INTO qualifications (qualification_code, qualification_name)
VALUES
    ('MBBS', 'Bachelor of Medicine, Bachelor of Surgery'),
    ('MD',   'Doctor of Medicine'),
    ('MS',   'Master of Surgery'),
    ('BDS',  'Bachelor of Dental Surgery'),
    ('DM',   'Doctorate of Medicine'),
    ('MDS',  'Master of Dental Surgery'),
    ('BAMS', 'Bachelor of Ayurvedic Medicine and Surgery'),
    ('BHMS', 'Bachelor of Homeopathic Medicine and Surgery')
ON CONFLICT DO NOTHING;


CREATE OR REPLACE FUNCTION register_doctor(
    p_full_name VARCHAR,
    p_experience_years NUMERIC,
    p_gender_id INT,
    p_phone_number VARCHAR,
    p_email VARCHAR,
    p_consultation_fee NUMERIC,
    p_profile_image VARCHAR,
    p_joining_date DATE,
    p_qualification_ids INT[]
)
RETURNS INT AS $$
DECLARE
    v_doctor_id INT;
BEGIN
    INSERT INTO doctors (
        full_name,
        experience_years,
        gender_id,
        phone_number,
        email,
        consultation_fee,
        profile_image,
        joining_date
    )
    VALUES (
        p_full_name,
        p_experience_years,
        p_gender_id,
        p_phone_number,
        p_email,
        p_consultation_fee,
        COALESCE(p_profile_image, '/media/defaults/patient.png'),
        p_joining_date
    )
    RETURNING doctor_id INTO v_doctor_id;

    INSERT INTO doctor_qualifications (doctor_id, qualification_id)
    SELECT v_doctor_id, unnest(p_qualification_ids);

    RETURN v_doctor_id;

EXCEPTION
    WHEN unique_violation THEN
        RETURN -1;   -- email / phone duplicate
    WHEN foreign_key_violation THEN
        RETURN -2;   -- invalid gender / qualification
    WHEN OTHERS THEN
        RETURN -99;  -- unknown error
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_doctor_profile(
    p_doctor_id INT,
    p_full_name VARCHAR,
    p_experience_years NUMERIC,
    p_gender_id INT,
    p_phone_number VARCHAR,
    p_email VARCHAR,
    p_consultation_fee NUMERIC,
    p_profile_image VARCHAR,
    p_qualification_ids INT[]
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE doctors
    SET
        full_name = p_full_name,
        experience_years = p_experience_years,
        gender_id = p_gender_id,
        phone_number = p_phone_number,
        email = p_email,
        consultation_fee = p_consultation_fee,
        profile_image = p_profile_image,
        updated_at = NOW()
    WHERE doctor_id = p_doctor_id
      AND is_active = TRUE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    DELETE FROM doctor_qualifications
    WHERE doctor_id = p_doctor_id;

    INSERT INTO doctor_qualifications (doctor_id, qualification_id)
    SELECT p_doctor_id, unnest(p_qualification_ids);

    RETURN TRUE;

EXCEPTION
    WHEN unique_violation THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_doctors_list()
RETURNS TABLE (
    doctor_id INT,
    full_name VARCHAR,
    gender VARCHAR,
    email VARCHAR,
    consultation_fee NUMERIC,
    qualifications TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.doctor_id,
        d.full_name,
        g.gender_value,
        d.email,
        d.consultation_fee,
        COALESCE(ARRAY_AGG(DISTINCT q.qualification_code ORDER BY q.qualification_code), ARRAY[]::text[])
    FROM doctors d
    LEFT JOIN genders g ON g.gender_id = d.gender_id
    LEFT JOIN doctor_qualifications dq ON dq.doctor_id = d.doctor_id
    LEFT JOIN qualifications q ON q.qualification_id = dq.qualification_id
    WHERE d.is_active = TRUE
    GROUP BY d.doctor_id, g.gender_value
    ORDER BY d.full_name;
END;
$$ LANGUAGE plpgsql;


-- SELECT register_doctor('Dr. Chirag Dumaniya', 2, 1, '9879879870', 'chirag@gmail.com', 500, '/media/defaults/patient.png', '2025-01-01', ARRAY[1]);
-- SELECT register_doctor('Dr. Mehul Patel', 5, 1, '9988776655', 'mehul@gmail.com', 800, '/media/defaults/patient.png', '2024-06-15', ARRAY[1,2]);
-- SELECT register_doctor('Dr. Riya Shah', 3, 2, '9090909090', 'riya@gmail.com', 600, '/media/defaults/patient.png', '2023-03-10', ARRAY[4]);
-- SELECT register_doctor('Dr. Hardik Joshi', 7, 1, '9123456789', 'hardik@gmail.com', 400, '/media/defaults/patient.png', '2022-07-20', ARRAY[7]);
-- SELECT register_doctor('Dr. Sneha Trivedi', 4, 2, '9345678123', 'sneha@gmail.com', 450, '/media/defaults/patient.png', '2021-11-05', ARRAY[8]);
-- SELECT register_doctor('Dr. Kunal Desai', 6, 1, '9012345678', 'kunal@gmail.com', 900, '/media/defaults/patient.png', '2020-09-18', ARRAY[1,3]);
-- SELECT register_doctor('Dr. Neha Vyas', 8, 2, '9898989898', 'neha@gmail.com', 750, '/media/defaults/patient.png', '2019-04-22', ARRAY[2]);
-- SELECT register_doctor('Dr. Amit Bhatt', 10, 1, '9765432109', 'amit@gmail.com', 1000, '/media/defaults/patient.png', '2018-02-14', ARRAY[1,5]);
-- SELECT register_doctor('Dr. Pooja Mehta', 5, 2, '9456123789', 'pooja@gmail.com', 650, '/media/defaults/patient.png', '2021-08-30', ARRAY[4,6]);
-- SELECT register_doctor('Dr. Raj Malhotra', 12, 1, '9234567812', 'raj@gmail.com', 1100, '/media/defaults/patient.png', '2017-12-05', ARRAY[1,2,5]); 