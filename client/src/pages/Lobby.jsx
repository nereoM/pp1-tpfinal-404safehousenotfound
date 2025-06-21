import {
  ArrowRight,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from 'react-router-dom';
import Header from "../components/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/shadcn/Accordion";
import { Badge } from "../components/shadcn/Badge";
import { Button } from "../components/shadcn/Button";
import { Card, CardContent } from "../components/shadcn/Card";

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Automatización Inteligente",
      description:
        "Procesos de reclutamiento automatizados que ahorran hasta 80% del tiempo",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Analytics Avanzados",
      description: "Dashboards en tiempo real con métricas que importan",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Seguridad Total",
      description: "Datos protegidos con encriptación de nivel empresarial",
    },
  ];

  const testimonials = [
    {
      name: "Ana González",
      role: "Directora de RRHH",
      company: "TechCorp",
      content:
        "SIGRH+ revolucionó nuestro proceso de contratación. Reducimos el tiempo de selección en un 70%.",
      rating: 5,
    },
    {
      name: "Carlos Fernández",
      role: "Gerente de Talento",
      company: "InnovateX",
      content: "La mejor inversión que hicimos este año. El ROI fue inmediato.",
      rating: 5,
    },
    {
      name: "María López",
      role: "CEO",
      company: "StartupHub",
      content:
        "Escalamos de 10 a 100 empleados sin perder calidad en el proceso de selección.",
      rating: 5,
    },
    {
      name: "Roberto Silva",
      role: "Director de Operaciones",
      company: "GlobalTech",
      content:
        "Los reportes automáticos nos dan insights que nunca tuvimos antes.",
      rating: 5,
    },
    {
      name: "Laura Martín",
      role: "Head of HR",
      company: "FutureWork",
      content:
        "Nuestros candidatos ahora tienen una experiencia excepcional desde el primer contacto.",
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: "¿Qué incluye el plan básico?",
      answer:
        "El plan básico incluye gestión de hasta 50 candidatos, reportes básicos, soporte por email y todas las funcionalidades core de reclutamiento.",
    },
    {
      question: "¿Puedo cambiar de plan en cualquier momento?",
      answer:
        "Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los cambios se reflejan inmediatamente y solo pagas la diferencia prorrateada.",
    },
    {
      question: "¿Ofrecen integración con otras herramientas?",
      answer:
        "Sí, nos integramos con más de 50 herramientas populares incluyendo Slack, Microsoft Teams, LinkedIn, y sistemas de nómina.",
    },
    {
      question: "¿Qué tipo de soporte ofrecen?",
      answer:
        "Ofrecemos soporte 24/7 por chat, email y teléfono. También incluimos onboarding personalizado y training para tu equipo.",
    },
    {
      question: "¿Es seguro almacenar datos sensibles?",
      answer:
        "Absolutamente. Cumplimos con GDPR, SOC 2 Type II y utilizamos encriptación AES-256. Tus datos están más seguros que en un banco.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SIGRH+</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Características
            </a>
            <a
              href="#testimonials"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Testimonios
            </a>
            <a
              href="#faq"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              FAQ
            </a>
            <Button
              variant="outline"
              className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Iniciar Sesión
            </Button>
          </nav>
        </div>
      </header>
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Nuevo: IA integrada
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  El futuro del
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {" "}
                    reclutamiento
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Automatiza, optimiza y escala tus procesos de RRHH con la
                  plataforma más avanzada del mercado.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/precios">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg"
                  >
                  Ver planes empresariales
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                  </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 px-8 py-4 text-lg"
                >
                  Ver demo
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-600">Empresas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">50k+</div>
                  <div className="text-sm text-gray-600">Candidatos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">98%</div>
                  <div className="text-sm text-gray-600">Satisfacción</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-3xl blur-3xl opacity-20"></div>
              <img
                src="https://i.postimg.cc/y8Zq356p/person-using-sigrh-happy.png"
                alt="Dashboard SIGRH+"
                className="relative w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Potencia tu equipo de RRHH
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Herramientas diseñadas para profesionales que buscan resultados
              excepcionales
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
                  hoveredFeature === index
                    ? "scale-105 bg-gradient-to-br from-blue-50 to-indigo-50"
                    : "bg-white"
                }`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                    hoveredFeature === index
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section with Infinite Scroll */}
      <section
        id="testimonials"
        className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Historias de éxito reales
            </h2>
            <p className="text-xl text-gray-600">
              Descubre cómo SIGRH+ está transformando equipos de RRHH
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="flex animate-scroll space-x-6">
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <Card
                key={index}
                className="flex-shrink-0 w-80 p-6 bg-white shadow-lg"
              >
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-blue-600">
                      {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Preguntas frecuentes
            </h2>
            <p className="text-xl text-gray-600">
              Todo lo que necesitas saber sobre SIGRH+
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-gray-200 rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            ¿Listo para transformar tu RRHH?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a más de 500 empresas que ya confían en SIGRH+
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
            >
              Comenzar prueba gratuita
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-whit text-blue-600 hover:bg-white hover:text-blue-600 px-8 py-4 text-lg"
            >
              Hablar con ventas
            </Button>
          </div>
        </div>
      </section>

      {/* Company Logos */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-gray-600 mb-8 font-medium">
            Empresas que confían en nosotros
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <img
              src="https://i.postimg.cc/bw3nb66b/nintendo.png"
              alt="Nintendo"
              className="h-8 w-24 object-contain grayscale hover:grayscale-0 transition-all"
            />
            <img
              src="https://i.postimg.cc/fTyCPNYk/capcom.png"
              alt="Capcom"
              className="h-8 w-24 object-contain grayscale hover:grayscale-0 transition-all"
            />
            <img
              src="https://i.postimg.cc/QxckBJGk/mappa.png"
              alt="Mappa"
              className="h-8 w-24 object-contain grayscale hover:grayscale-0 transition-all"
            />
            <img
              src="https://i.postimg.cc/LsGFJDR3/cafe-martinez.png"
              alt="Café Martínez"
              className="h-8 w-24 object-contain grayscale hover:grayscale-0 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">SIGRH+</span>
              </div>
              <p className="text-gray-400">
                La plataforma de RRHH más avanzada para empresas modernas.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Características
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Precios
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Integraciones
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Sobre nosotros
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Carreras
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Centro de ayuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contacto
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Estado del servicio
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SIGRH+. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
