import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus, Eye, EyeOff, Gamepad2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const signupSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  sex: z.enum(["M", "F", "O"], { required_error: "Selecione o sexo" }),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória").refine((val) => {
    const birth = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 18;
  }, "Apenas maiores de 18 anos podem se cadastrar"),
  whatsapp: z
    .string()
    .regex(/^[0-9]{10,11}$/, "WhatsApp deve ter 10 ou 11 dígitos numéricos"),
  email: z.string().email("Email inválido").max(255, "Email muito longo"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  userType: z.enum(["jogador", "juiz"], { required_error: "Selecione o tipo de usuário" }),
});

type SignupFormData = z.infer<typeof signupSchema>;

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailDuplicate, setEmailDuplicate] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const { toast } = useToast();
  const { signUp } = useAuth();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      sex: undefined,
      birthDate: "",
      whatsapp: "",
      email: "",
      password: "",
      userType: "jogador",
    },
  });

  const [nameDuplicate, setNameDuplicate] = useState(false);
  const [checkingName, setCheckingName] = useState(false);

  const checkEmailExists = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailDuplicate(false);
      return;
    }
    setCheckingEmail(true);
    try {
      // Use edge function to check auth.users directly (anon can't query auth)
      const { data, error } = await supabase.functions.invoke("check-email", {
        body: { email: email.trim().toLowerCase() },
      });
      setEmailDuplicate(data?.exists === true);
    } catch {
      setEmailDuplicate(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  const checkNameExists = async (name: string) => {
    if (!name || name.trim().length < 2) {
      setNameDuplicate(false);
      return;
    }
    setCheckingName(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .ilike("name", name.trim())
        .limit(1);
      setNameDuplicate(!!(data && data.length > 0));
    } catch {
      setNameDuplicate(false);
    } finally {
      setCheckingName(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast({
          title: "Erro no cadastro com Google",
          description: "Não foi possível cadastrar com Google. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro no cadastro com Google",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    if (emailDuplicate) {
      toast({ title: "Email já cadastrado", description: "Use outro email ou faça login.", variant: "destructive" });
      return;
    }
    if (nameDuplicate) {
      toast({ title: "Nome já cadastrado", description: "Escolha outro nome.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, {
        name: data.name,
        sex: data.sex,
        whatsapp: data.whatsapp,
        user_type: data.userType,
        birth_date: data.birthDate,
      });

      if (error) {
        const msg = error.message;
        toast({
          title: "Erro no cadastro",
          description: msg.includes("already registered") || msg.includes("already been registered")
            ? "Este email já está cadastrado. Faça login ou use outro email." 
            : msg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta. Você começa com 1.000 likes!",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card/80 border-border backdrop-blur-sm">
      <CardHeader className="text-center pb-2">
        <CardTitle className="font-cinzel text-xl md:text-2xl text-foreground flex items-center justify-center gap-2">
          <UserPlus className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          Cadastre-se
        </CardTitle>
        <p className="text-xs md:text-sm text-muted-foreground">
          Comece com 1.000 likes e concorra ao prêmio!
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* User Type Selection */}
            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-foreground">Tipo de Usuário</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-3"
                    >
                      <label
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                          field.value === "jogador"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value="jogador" id="jogador" />
                        <Gamepad2 className="w-4 h-4 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">Jogador</span>
                          <span className="text-xs text-muted-foreground">Publica e concorre</span>
                        </div>
                      </label>
                      <label
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                          field.value === "juiz"
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-accent/50"
                        }`}
                      >
                        <RadioGroupItem value="juiz" id="juiz" />
                        <Scale className="w-4 h-4 text-accent" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">Juiz</span>
                          <span className="text-xs text-muted-foreground">Apenas vota</span>
                        </div>
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Seu nome completo"
                      className={`bg-input border-border focus:border-primary ${nameDuplicate ? "border-destructive" : ""}`}
                      {...field}
                      onBlur={(e) => {
                        field.onBlur();
                        checkNameExists(e.target.value);
                      }}
                    />
                  </FormControl>
                  {nameDuplicate && (
                    <p className="text-sm font-medium text-destructive">Nome já cadastrado, escolha outro</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sex */}
            <FormField
              control={form.control}
              name="sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Sexo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-input border-border focus:border-primary">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="O">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data de Nascimento */}
            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => {
                const isUnder18 = (() => {
                  if (!field.value) return false;
                  const birth = new Date(field.value);
                  const today = new Date();
                  let age = today.getFullYear() - birth.getFullYear();
                  const m = today.getMonth() - birth.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                  return age < 18;
                })();
                return (
                  <FormItem>
                    <FormLabel className="text-foreground">Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className={`bg-input border-border focus:border-primary ${isUnder18 ? "border-destructive ring-2 ring-destructive" : ""}`}
                        max={new Date().toISOString().split('T')[0]}
                        {...field}
                      />
                    </FormControl>
                    {isUnder18 && (
                      <div className="bg-destructive/10 border border-destructive rounded-lg p-3 mt-1">
                        <p className="text-sm font-bold text-destructive">🚫 Apenas maiores de 18 anos podem se cadastrar!</p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">WhatsApp</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="11999999999"
                      className="bg-input border-border focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      className={`bg-input border-border focus:border-primary ${emailDuplicate ? "border-destructive" : ""}`}
                      {...field}
                      onBlur={(e) => {
                        field.onBlur();
                        checkEmailExists(e.target.value);
                      }}
                    />
                  </FormControl>
                  {emailDuplicate && (
                    <p className="text-sm font-medium text-destructive">E-mail já cadastrado, escolha outro</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••"
                        className="bg-input border-border focus:border-primary pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-cinzel text-lg shadow-gold"
              disabled={isLoading}
            >
              {isLoading ? "Cadastrando..." : "CADASTRAR"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-border text-foreground hover:bg-accent"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Cadastrar com Google
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
