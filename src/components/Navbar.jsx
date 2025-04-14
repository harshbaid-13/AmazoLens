import { Link, useLocation } from "react-router-dom";

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: "📊" },
    {
      name: "Customer Segmentation",
      path: "/customer-segmentation",
      icon: "👥",
    },
    { name: "Regional Sales", path: "/regional-sales", icon: "🌎" },
    {
      name: "Product Recommendations",
      path: "/product-recommendation",
      icon: "🛒",
    },
    { name: "Sentiment Analysis", path: "/sentiment-analysis", icon: "😊" },
    { name: "Topic Mining", path: "/topic-mining", icon: "📝" },
  ];

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-blue-800 text-white transition duration-300 lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-center h-16 bg-blue-900">
          <h2 className="text-2xl font-bold">AmazoLens</h2>
        </div>

        <nav className="mt-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 transition-colors hover:bg-blue-700 ${
                location.pathname === item.path ? "bg-blue-700" : ""
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none"
        >
          <span className="text-2xl">☰</span>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">AmazoLens</h1>
      </div>
    </>
  );
}
