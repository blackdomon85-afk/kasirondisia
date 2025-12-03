import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
<<<<<<< HEAD
import logoKasir from "@/assets/tokohku.jpeg";
=======
import logoKasir from "@/assets/logo-kasir.png";
>>>>>>> c37c15a82851723797f488514aa3e6f16c4ff59e

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const { signIn, user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect based on user role after login
  useEffect(() => {
    if (user && userRole) {
      if (userRole === "admin") {
        navigate("/admin");
      } else if (userRole === "kasir") {
        navigate("/kasir");
      }
    }
  }, [user, userRole, navigate]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast({
        title: "Login Gagal",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Login Berhasil",
        description: "Selamat datang!",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={logoKasir} 
              alt="Logo Sistem Kasir" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Sistem Kasir</CardTitle>
          <CardDescription>
            Masuk untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="nama@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
