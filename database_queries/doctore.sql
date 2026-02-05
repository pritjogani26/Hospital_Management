CREATE TABLE genders (
    gender_id SERIAL PRIMARY KEY,
    gender_value VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

drop table qualifications;
CREATE TABLE qualifications (
    qualification_id SERIAL PRIMARY KEY,
    qualification_code VARCHAR(10) UNIQUE NOT NULL,
    qualification_name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

drop table doctors;
CREATE TABLE doctors (
    doctor_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    experience_years NUMERIC(4,2) NOT NULL CHECK (experience_years >= 0),
    gender_id INT REFERENCES genders(gender_id),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    consultation_fee NUMERIC(10,2),
    profile_image VARCHAR(255),
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
        p_profile_image,
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



CREATE OR REPLACE FUNCTION get_doctor_profile(
    p_doctor_id INT
)
RETURNS TABLE (
    doctor_id INT,
    full_name VARCHAR,
    experience_years NUMERIC,
    gender VARCHAR,
    phone_number VARCHAR,
    email VARCHAR,
    consultation_fee NUMERIC,
    profile_image VARCHAR,
    joining_date DATE,
    qualifications TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.doctor_id,
        d.full_name,
        d.experience_years,
        g.gender_value,
        d.phone_number,
        d.email,
        d.consultation_fee,
        d.profile_image,
        d.joining_date,
        ARRAY_AGG(q.qualification_code ORDER BY q.qualification_code)
    FROM doctors d
    LEFT JOIN genders g ON g.gender_id = d.gender_id
    LEFT JOIN doctor_qualifications dq ON dq.doctor_id = d.doctor_id
    LEFT JOIN qualifications q ON q.qualification_id = dq.qualification_id
    WHERE d.doctor_id = p_doctor_id
      AND d.is_active = TRUE
    GROUP BY d.doctor_id, g.gender_value;
END;
$$ LANGUAGE plpgsql;