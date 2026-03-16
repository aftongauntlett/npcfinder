-- Security hardening: prevent third-party forged connections via direct RPC

REVOKE EXECUTE ON FUNCTION public.create_bidirectional_connection(uuid, uuid) FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.create_bidirectional_connection(user_a uuid, user_b uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF auth.uid() IS NULL OR (auth.uid() != user_a AND auth.uid() != user_b) THEN
    RAISE EXCEPTION 'Permission denied: caller must be one of the connected users'
      USING ERRCODE = '42501';
  END IF;

  -- Don't create self-connections
  IF user_a = user_b THEN
    RETURN;
  END IF;

  -- Insert A → B
  INSERT INTO public.connections (user_id, friend_id)
  VALUES (user_a, user_b)
  ON CONFLICT (user_id, friend_id) DO NOTHING;

  -- Insert B → A
  INSERT INTO public.connections (user_id, friend_id)
  VALUES (user_b, user_a)
  ON CONFLICT (user_id, friend_id) DO NOTHING;
END;
$$;
