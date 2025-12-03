import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, LayoutDashboard } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Sistem POS
          </h1>
          <p className="text-xl text-muted-foreground">
            Pilih role untuk melanjutkan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg cursor-pointer group" onClick={() => navigate("/kasir")}>
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <ShoppingCart className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Kasir
              </h2>
              <p className="text-muted-foreground mb-6">
                Proses transaksi, scan barcode, dan cetak nota
              </p>
              <Button className="w-full" size="lg">
                Masuk sebagai Kasir
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg cursor-pointer group" onClick={() => navigate("/admin")}>
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <LayoutDashboard className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Admin
              </h2>
              <p className="text-muted-foreground mb-6">
                Kelola produk, stok, dan lihat laporan
              </p>
              <Button className="w-full" size="lg">
                Masuk sebagai Admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
