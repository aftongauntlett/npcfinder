-- Security hardening: remove legacy board_shares table after emptiness verification

DO $$
DECLARE
  board_shares_count bigint;
BEGIN
  SELECT COUNT(*) INTO board_shares_count FROM public.board_shares;

  IF board_shares_count > 0 THEN
    RAISE EXCEPTION 'Refusing to drop public.board_shares because it contains % rows', board_shares_count;
  END IF;
END;
$$;

DROP TABLE IF EXISTS public.board_shares;
