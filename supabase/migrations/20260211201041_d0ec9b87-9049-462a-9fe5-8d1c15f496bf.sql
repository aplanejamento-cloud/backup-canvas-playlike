
-- Update handle_new_user to include birth_date
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, sex, whatsapp, user_type, birth_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Jogador'),
    COALESCE(NEW.raw_user_meta_data->>'sex', 'O'),
    NEW.raw_user_meta_data->>'whatsapp',
    COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type, 'jogador'),
    (NEW.raw_user_meta_data->>'birth_date')::date
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;
