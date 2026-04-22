-- Pipeline general (`__default__`): columnas = todos los `status` distintos en `leads`
-- (orden: etapas estándar del CRM primero, luego el resto alfabético). Etiquetas para slugs no estándar.

DO $$
DECLARE
  v_order jsonb;
  v_custom jsonb;
  v_cfg jsonb;
BEGIN
  SELECT COALESCE(
    jsonb_agg(s ORDER BY o, s),
    '["nuevo","contactado","calificado","negociacion","cerrado","perdido"]'::jsonb
  )
  INTO v_order
  FROM (
    SELECT DISTINCT
      trim(status) AS s,
      CASE lower(trim(status))
        WHEN 'nuevo' THEN 1
        WHEN 'contactado' THEN 2
        WHEN 'calificado' THEN 3
        WHEN 'negociacion' THEN 4
        WHEN 'cerrado' THEN 5
        WHEN 'perdido' THEN 6
        ELSE 50
      END AS o
    FROM public.leads
    WHERE trim(coalesce(status, '')) <> ''
  ) q;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id',
        s,
        'label',
        initcap(regexp_replace(s, '_', ' ', 'g'))
      )
      ORDER BY s
    ),
    '[]'::jsonb
  )
  INTO v_custom
  FROM (
    SELECT DISTINCT trim(status) AS s
    FROM public.leads
    WHERE trim(coalesce(status, '')) <> ''
      AND lower(trim(status)) NOT IN (
        'nuevo',
        'contactado',
        'calificado',
        'negociacion',
        'cerrado',
        'perdido'
      )
  ) x;

  v_cfg := jsonb_build_object(
    'customStages',
    v_custom,
    'stageOrder',
    v_order,
    'stageColors',
    '{}'::jsonb
  );

  INSERT INTO public.sales_pipeline_configs (group_id, config, updated_at)
  VALUES ('__default__', v_cfg, now())
  ON CONFLICT (group_id) DO UPDATE
  SET
    config = excluded.config,
    updated_at = now();
END $$;
