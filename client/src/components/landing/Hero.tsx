import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  BoltIcon, 
  ArrowRightIcon, 
  SparklesIcon, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Globe2, 
  Share, 
  Star,
  TrendingUp,
  PlayCircle,
  Users,
  Award,
  Rocket
} from "lucide-react";
import { useState, useEffect } from "react";

export function Hero() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50/50 to-purple-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20 pt-12 pb-20 lg:pt-20 lg:pb-32">
      {/* Enhanced Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated floating shapes */}
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/15 to-blue-400/15 rounded-full blur-2xl animate-bounce slow"></div>
        <div className="absolute top-3/4 left-1/4 w-48 h-48 bg-gradient-to-r from-indigo-400/15 to-purple-400/15 rounded-full blur-2xl animate-bounce slow delay-500"></div>
        
        {/* Geometric patterns */}
        <div className="absolute top-20 right-20 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-60 animate-ping"></div>
        <div className="absolute bottom-32 left-16 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-60 animate-ping delay-300"></div>
        <div className="absolute top-1/3 left-20 w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-60 animate-ping delay-700"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.1)_1px,transparent_0)] bg-[size:40px_40px] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(139,92,246,0.1)_1px,transparent_0)]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-12 md:pt-16">
        {/* Hero Header */}
        <div className={`text-center max-w-5xl mx-auto mb-16 md:mb-24 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Enhanced Badge */}
          <div className="inline-flex items-center px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-6 border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm shadow-lg">
            <SparklesIcon className="w-5 h-5 mr-2 animate-pulse" />
            <span>{t("landing.hero.badge")}</span>
            <Rocket className="w-4 h-4 ml-2 text-purple-500" />
          </div>
          
          {/* Enhanced Title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black font-heading tracking-tight mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent bg-300% animate-gradient leading-tight">
            {t("landing.hero.title")}
          </h1>
          
          {/* Enhanced Subtitle */}
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-200 max-w-4xl mx-auto font-light leading-relaxed mb-8">
            {t("landing.hero.subtitle")}
          </p>
          
          {/* Stats Row */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-12 text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">1,000+</span>
              <span>{t("landing.hero.stats.users")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">4.9/5</span>
              <span>{t("landing.hero.stats.reviews")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">50,000+</span>
              <span>{t("landing.hero.stats.articlesCreated")}</span>
            </div>
          </div>
          
          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/auth" className="group">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 text-lg font-semibold transform hover:scale-105 hover:-translate-y-1">
                <BoltIcon className="w-6 h-6 mr-3 group-hover:animate-bounce" />
                {t("landing.hero.tryFree")}
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <PlayCircle className="w-6 h-6 mr-3" />
              {t("landing.hero.viewDemo")}
            </Button>
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left column - Quick Features */}
          <div className={`lg:col-span-5 space-y-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            {/* Enhanced Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { 
                  icon: Zap, 
                  title: t("landing.hero.features.aiContent.title"), 
                  text: t("landing.hero.features.aiContent.description"), 
                  color: "text-blue-500",
                  bg: "from-blue-500/20 to-cyan-500/20",
                  iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600"
                },
                { 
                  icon: Globe2, 
                  title: t("landing.hero.features.multilingual.title"), 
                  text: t("landing.hero.features.multilingual.description"), 
                  color: "text-amber-500",
                  bg: "from-amber-500/20 to-orange-500/20",
                  iconBg: "bg-gradient-to-br from-amber-500 to-orange-600"
                },
                { 
                  icon: Share, 
                  title: t("landing.hero.features.integration.title"), 
                  text: t("landing.hero.features.integration.description"), 
                  color: "text-emerald-500",
                  bg: "from-emerald-500/20 to-teal-500/20",
                  iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600"
                },
                { 
                  icon: TrendingUp, 
                  title: t("landing.hero.features.analytics.title"), 
                  text: t("landing.hero.features.analytics.description"), 
                  color: "text-purple-500",
                  bg: "from-purple-500/20 to-pink-500/20",
                  iconBg: "bg-gradient-to-br from-purple-500 to-pink-600"
                }
              ].map((feature, i) => (
                <div key={i} className={`relative group p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 hover:shadow-xl hover:shadow-${feature.color}/10 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] overflow-hidden`}>
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}></div>
                  
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.iconBg} shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-gray-800 dark:group-hover:text-white transition-colors">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right column - Enhanced App Preview */}
          <div className={`lg:col-span-7 flex justify-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="relative w-full max-w-4xl group animate-float">
              {/* Background glow effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl transform scale-110 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Main App Preview Container */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl transform group-hover:scale-[1.02] transition-all duration-700">
                {/* Enhanced Header */}
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-1">
                  <div className="bg-white/95 dark:bg-gray-800/95 rounded-t-3xl">
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse delay-100"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse delay-200"></div>
                        </div>
                        <div className="hidden sm:block bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                          toolbox.ai
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Live</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* App Interface Preview */}
                <div className="relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
                  {/* Dashboard-like Interface */}
                  <div className="space-y-6">
                    {/* Top Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Bài viết", value: "1,247", color: "bg-blue-500", trend: "+12%" },
                        { label: "Lượt xem", value: "89.2K", color: "bg-purple-500", trend: "+28%" },
                        { label: "SEO Score", value: "94%", color: "bg-emerald-500", trend: "+5%" }
                      ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center`}>
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{stat.trend}</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Content Preview */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white">Bài viết mới nhất</h3>
                          <div className="flex gap-2">
                            <div className="w-6 h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                            <div className="w-6 h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse delay-100"></div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                              <div className="w-4 h-4 bg-white rounded-sm"></div>
                            </div>
                            <div className="flex-1">
                              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded mb-2 animate-pulse" style={{width: `${80 + i * 10}%`}}></div>
                              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded animate-pulse delay-200" style={{width: `${60 + i * 5}%`}}></div>
                            </div>
                            <div className="text-xs text-green-500 font-semibold bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                              SEO 9{i}/100
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Feature Callouts */}
              <div className="absolute -top-4 -right-4 lg:-right-8 lg:top-12 glass dark:glass-dark rounded-2xl p-4 max-w-xs transform rotate-3 group-hover:rotate-0 group-hover:scale-105 transition-all duration-500 animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <SparklesIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">AI SEO Optimizer</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Tự động tối ưu SEO</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -left-4 lg:-left-8 lg:bottom-16 glass dark:glass-dark rounded-2xl p-4 max-w-xs transform -rotate-2 group-hover:rotate-0 group-hover:scale-105 transition-all duration-500 animate-bounce-slow delay-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Globe2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">Đa ngôn ngữ</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Hỗ trợ tiếng Việt</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-1/2 -right-6 lg:-right-12 glass dark:glass-dark rounded-2xl p-4 max-w-xs transform rotate-1 group-hover:rotate-0 group-hover:scale-105 transition-all duration-500 animate-bounce-slow delay-1000">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">Phân tích real-time</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Theo dõi hiệu suất</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
