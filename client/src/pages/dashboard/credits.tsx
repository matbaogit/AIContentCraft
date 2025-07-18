import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { useLanguage } from "@/hooks/use-language";
import { useDbTranslations } from "@/hooks/use-db-translations";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Plan, CreditTransaction } from "@shared/schema";
import {
  Check,
  Coins,
  CreditCard,
  DollarSign,
  ShieldCheck,
  History,
} from "lucide-react";
import Head from "@/components/head";
import { Link } from "wouter";

interface CreditHistoryResponse {
  transactions: CreditTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function Credits() {
  const { t } = useLanguage();
  const { t: tDb } = useDbTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch credit plans
  const { data: plansResponse, isLoading: isLoadingPlans } = useQuery<{success: boolean, data: Plan[]}>({
    queryKey: ["/api/plans", { type: "credit" }],
  });
  
  // Extract plans from the response
  const plans = plansResponse?.data || [];

  // Fetch credit history
  const { data: creditHistoryResponse, isLoading: isLoadingHistory } = useQuery<{success: boolean, data: CreditHistoryResponse}>({
    queryKey: ["/api/dashboard/credits/history", { page: currentPage, limit: 10 }],
  });
  
  // Extract credit history from the response
  const creditHistory = creditHistoryResponse?.data;

  // Purchase credit mutation
  const purchaseCreditMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest("POST", "/api/dashboard/credits/purchase", { planId });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: tDb("dashboard.credits.purchaseSuccess"),
        description: tDb("dashboard.credits.purchaseSuccessDesc").replace("{amount}", data.data.amount.toString()),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/credits/history"] });
      setIsPurchaseDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: tDb("dashboard.credits.purchaseFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePurchase = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsPurchaseDialogOpen(true);
  };

  const confirmPurchase = () => {
    if (selectedPlan) {
      purchaseCreditMutation.mutate(selectedPlan.id);
    }
  };

  // Helper function to get translated plan name
  const getPlanName = (planName: string) => {
    if (planName.includes("Cơ Bản")) return tDb("dashboard.credits.basicPlan");
    if (planName.includes("Chuyên Nghiệp") || planName.includes("Nâng Cao")) return tDb("dashboard.credits.professionalPlan");
    if (planName.includes("Doanh Nghiệp")) return tDb("dashboard.credits.enterprisePlan");
    if (planName.includes("Miễn Phí")) return tDb("dashboard.credits.freePlan");
    return planName; // fallback to original name
  };

  return (
    <>
      <Head>
        <title>{tDb("dashboard.credits.title")} - {t("common.appName")}</title>
      </Head>
      
      <DashboardLayout title={tDb("dashboard.credits.title")}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                <Coins className="mr-2 h-5 w-5 text-primary-600" />
                {tDb("dashboard.credits.currentBalance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary-600">
                {user?.credits || 0}
                <span className="ml-2 text-lg text-gray-700 dark:text-gray-300">{tDb("dashboard.credits.title").toLowerCase()}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {tDb("dashboard.credits.usageDescription")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">{tDb("dashboard.credits.specialPromotion")}</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">{tDb("dashboard.credits.limitedOffer")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 dark:text-gray-100 font-semibold">
                {tDb("dashboard.credits.bonusOffer")}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {tDb("dashboard.credits.validUntil")}
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full border-blue-300 dark:border-blue-700 text-gray-900 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                onClick={() => {
                  toast({
                    title: "Đã sao chép mã khuyến mãi!",
                    description: "Sử dụng EXTRA5 khi thanh toán",
                  });
                }}
              >
                EXTRA5
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="w-full">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("dashboard.credits.buyCredits")}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Chọn gói tín dụng phù hợp với nhu cầu của bạn</p>
          </div>

          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLoadingPlans ? (
                <div className="col-span-3 text-center py-10">{tDb("dashboard.credits.loadingPlans")}</div>
              ) : (
                plans?.map((plan) => (
                  <Card key={plan.id} className={plan.name.includes("Nâng Cao") ? "border-2 border-accent-500" : ""}>
                    <CardHeader className={plan.name.includes("Nâng Cao") ? "bg-accent-500 text-white" : "bg-primary-600 text-white"}>
                      <CardTitle>{getPlanName(plan.name)}</CardTitle>
                      <CardDescription className="text-white/90 flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatCurrency(plan.price)}
                      </CardDescription>
                      {plan.name.includes("Nâng Cao") && (
                        <div className="absolute -top-3 right-0 left-0 mx-auto w-max bg-accent-600 text-white text-xs font-bold py-1 px-3 rounded-full">
                          {t("landing.pricing.popular")}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="pt-6">
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span>{plan.value} {tDb("dashboard.credits.title").toLowerCase()}</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span>
                            ~{plan.name.includes("Cơ Bản") ? "1000" : 
                               plan.name.includes("Nâng Cao") ? "1500" : "2000"} {tDb("dashboard.credits.wordsPerCredit")}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span>
                            {t("landing.pricing.features.seoOptimization")}
                            {plan.name.includes("Nâng Cao") ? " +" : 
                             plan.name.includes("Chuyên Nghiệp") ? " ++" : ""}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span>
                            {t("landing.pricing.features.support")}
                            {plan.name.includes("Cơ Bản") ? " (email)" :
                             plan.name.includes("Nâng Cao") ? " (priority)" : " (24/7)"}
                          </span>
                        </li>
                        {(plan.name.includes("Nâng Cao") || plan.name.includes("Chuyên Nghiệp")) && (
                          <li className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span>
                              {plan.name.includes("Nâng Cao") ? "10%" : "20%"} {t("landing.pricing.features.saving")}
                            </span>
                          </li>
                        )}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className={`w-full ${plan.name.includes("Nâng Cao") ? "bg-accent-500 hover:bg-accent-600" : ""}`}
                        onClick={() => handlePurchase(plan)}
                      >
                        {t("landing.pricing.buyNow")}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Purchase Confirmation Dialog */}
        <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Purchase</DialogTitle>
              <DialogDescription>
                You are about to purchase the {selectedPlan?.name} for {formatCurrency(selectedPlan?.price || 0)}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <Coins className="h-10 w-10 text-primary-600" />
                <div>
                  <h3 className="font-medium">{selectedPlan?.value} Credits</h3>
                  <p className="text-sm text-muted-foreground">Will be added to your account</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <CreditCard className="h-10 w-10 text-secondary-600" />
                <div>
                  <h3 className="font-medium">Payment</h3>
                  <p className="text-sm text-muted-foreground">
                    Secure payment via Stripe/MoMo/VNPAY
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <ShieldCheck className="h-10 w-10 text-green-600" />
                <div>
                  <h3 className="font-medium">Money Back Guarantee</h3>
                  <p className="text-sm text-muted-foreground">
                    7-day refund policy for unused credits
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsPurchaseDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmPurchase}
                disabled={purchaseCreditMutation.isPending}
              >
                {purchaseCreditMutation.isPending ? "Processing..." : "Confirm Purchase"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}
