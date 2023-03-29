CREATE OR REPLACE FUNCTION date_bin (
    trunc_period INTERVAL,
    source_ts TIMESTAMPTZ,
    base_ts TIMESTAMPTZ)
    RETURNS TIMESTAMPTZ
    LANGUAGE SQL
    IMMUTABLE
AS $$
SELECT
        base_ts
        + FLOOR(EXTRACT(epoch FROM source_ts - base_ts) / EXTRACT(epoch FROM trunc_period))::BIGINT
            * trunc_period;
$$;