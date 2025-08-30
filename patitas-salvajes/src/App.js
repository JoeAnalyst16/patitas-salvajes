import React, { useState, useEffect } from "react";
import { Save, Upload, Package, Check, X, Edit, Trash2, Plus, Lock, AlertTriangle, Home, ShoppingBag, Mail, Phone, MapPin, Clock, Star } from "lucide-react";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    stock: 0,
    inStock: true,
    category: "alimento"
  });
  const [adminMode, setAdminMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");

  const ADMIN_KEY = "Patitassalvajes1996*";

  const categories = [
    { id: "todos", name: "Todos los productos" },
    { id: "alimento", name: "Alimentos" },
    { id: "medicina", name: "Medicinas" },
    { id: "juguetes", name: "Juguetes" },
    { id: "accesorios", name: "Accesorios" },
    { id: "higiene", name: "Higiene" }
  ];

  // --- Funciones de manejo ---

  // Carga los productos desde el servidor JSON al iniciar la aplicación
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:3001/products");
        if (!response.ok) {
          throw new Error("No se pudo conectar al servidor JSON.");
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error al cargar los productos:", error);
      }
    };
    fetchProducts();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, image: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      let url = "http://localhost:3001/products";
      let method = "POST";

      if (editingProduct) {
        url = `http://localhost:3001/products/${editingProduct.id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Vuelve a cargar los productos para reflejar los cambios
        const updatedProducts = await fetch("http://localhost:3001/products").then(res => res.json());
        setProducts(updatedProducts);
        
        // Limpia el formulario y el estado
        setFormData({
          name: "",
          price: "",
          description: "",
          image: "",
          stock: 0,
          inStock: true,
          category: "alimento"
        });
        setEditingProduct(null);
        setShowForm(false);
      } else {
        console.error("Error al guardar el producto");
      }
    } catch (error) {
      console.error("Error en la petición:", error);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      image: product.image || "",
      stock: product.stock || 0,
      inStock: product.inStock,
      category: product.category || "alimento"
    });
    setEditingProduct(product);
    setShowForm(true);
    setCurrentPage("productos");
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este producto?")) {
      try {
        const response = await fetch(`http://localhost:3001/products/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          // Actualiza el estado después de la eliminación exitosa
          setProducts(products.filter((p) => p.id !== id));
        } else {
          console.error("Error al eliminar el producto");
        }
      } catch (error) {
        console.error("Error en la petición de eliminación:", error);
      }
    }
  };

  const toggleStock = async (id) => {
    const productToUpdate = products.find(p => p.id === id);
    if (!productToUpdate) return;

    const updatedProduct = {
      ...productToUpdate,
      inStock: !productToUpdate.inStock
    };
    
    try {
      const response = await fetch(`http://localhost:3001/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        setProducts(products.map(p => p.id === id ? updatedProduct : p));
      } else {
        console.error("Error al actualizar el stock");
      }
    } catch (error) {
      console.error("Error en la petición de actualización:", error);
    }
  };

  const handleLogin = () => {
    if (password === ADMIN_KEY) {
      setAdminMode(true);
      setShowLogin(false);
      setPassword("");
      setError("");
    } else {
      setError("⚠️ Clave incorrecta, intenta de nuevo.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "todos" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // --- Componentes de página ---
  const HomePage = () => (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-600 via-green-500 to-blue-500 text-white py-24 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto text-center px-6">
          <div className="mb-6">
            <span className="text-6xl">🐾</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Cuidamos a tus <span className="text-yellow-300">Patitas Salvajes</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Los mejores productos veterinarios para el bienestar de tus mascotas
          </p>
          <button
            onClick={() => setCurrentPage("productos")}
            className="bg-white text-green-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-yellow-100 transition-all transform hover:scale-105 shadow-lg"
          >
            Ver Productos
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold mb-3">Calidad Premium</h3>
          <p className="text-gray-600">Productos de la más alta calidad para el cuidado integral de tus mascotas.</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-3">Entrega Rápida</h3>
          <p className="text-gray-600">Servicio de entrega eficiente para que tu mascota no espere.</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold mb-3">Amplio Catálogo</h3>
          <p className="text-gray-600">Desde alimentos hasta medicinas, todo lo que necesitas en un solo lugar.</p>
        </div>
      </section>

      {/* Productos destacados */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Productos Destacados</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {products.slice(0, 3).map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gray-100">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                <p className="text-2xl font-bold text-green-600 mb-2">${product.price}</p>
                <p className="text-gray-600 text-sm">{product.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <button
            onClick={() => setCurrentPage("productos")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Ver Todos los Productos
          </button>
        </div>
      </section>
    </div>
  );

  const ProductosPage = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Nuestros Productos</h1>
        
        {adminMode && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-lg transition-all hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
        )}
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Buscar productos
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              placeholder="Buscar por nombre o descripción..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Formulario de producto */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                  placeholder="Ej: Alimento Premium para Perros"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Precio *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border-2 border-gray-200 p-3 pl-8 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                >
                  {categories.slice(1).map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cantidad en Stock
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="inStock" className="text-sm font-semibold text-gray-700">
                  Producto disponible
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Imagen del Producto
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors relative">
                  {formData.image ? (
                    <div className="space-y-3">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-32 h-32 object-cover mx-auto rounded-lg shadow-md"
                      />
                      <button
                        onClick={() => setFormData({ ...formData, image: "" })}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Eliminar imagen
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Haz clic para subir una imagen</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="6"
                  className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                  placeholder="Describe las características del producto..."
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t mt-6">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg transition-all hover:shadow-xl"
            >
              <Save className="w-5 h-5" />
              {editingProduct ? "Actualizar Producto" : "Crear Producto"}
            </button>

            <button
              onClick={() => {
                setShowForm(false);
                setEditingProduct(null);
                setFormData({ name: "", price: "", description: "", image: "", stock: 0, inStock: true, category: "alimento" });
              }}
              className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de productos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No hay productos disponibles</p>
            <p className="text-gray-400">
              {adminMode ? 'Agrega tu primer producto haciendo clic en "Nuevo Producto"' : 'Pronto tendremos productos disponibles'}
            </p>
          </div>
        )}
        
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`bg-white rounded-xl shadow-lg overflow-hidden border transition-all hover:shadow-xl ${
              !product.inStock ? 'opacity-75 border-red-200' : 'border-gray-200'
            }`}
          >
            <div className="relative h-48 bg-gray-100">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="w-16 h-16 text-gray-300" />
                </div>
              )}
              
              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
                product.inStock 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}>
                {product.inStock ? (
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Disponible
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <X className="w-3 h-3" />
                    Sin Stock
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="mb-2">
                <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                  {categories.find(cat => cat.id === product.category)?.name || 'Sin categoría'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
              <p className="text-2xl font-bold text-green-600 mb-3">${product.price}</p>
              
              {product.stock !== undefined && (
                <p className="text-sm text-gray-600 mb-3">
                  Stock: <span className="font-semibold">{product.stock} unidades</span>
                </p>
              )}
              
              <p className="text-gray-600 text-sm mb-4">{product.description}</p>

              {adminMode && (
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => toggleStock(product.id)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      product.inStock
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {product.inStock ? 'Sin stock' : 'Disponible'}
                  </button>
                  <button
                    onClick={() => handleEdit(product)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ContactoPage = () => (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Contáctanos</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          ¿Tienes preguntas sobre nuestros productos? ¿Necesitas asesoría veterinaria? 
          Estamos aquí para ayudarte.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Información de contacto */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Información de Contacto</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">Teléfono</p>
                  <p className="text-gray-600">+56 9 1234 5678</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-gray-600">contacto@patitassalvajes.cl</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">Dirección</p>
                  <p className="text-gray-600">Chiguayante, Concepción, Chile</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold">Horarios</p>
                  <p className="text-gray-600">Lun - Vie: 9:00 - 18:00</p>
                  <p className="text-gray-600">Sáb: 9:00 - 14:00</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-3">¿Por qué elegirnos?</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Productos de calidad garantizada</li>
              <li>• Asesoría profesional especializada</li>
              <li>• Entrega rápida y segura</li>
              <li>• Atención personalizada</li>
              <li>• Más de 10 años de experiencia</li>
            </ul>
          </div>
        </div>

        {/* Formulario de contacto */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Envíanos un mensaje</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre completo
              </label>
              <input
                type="text"
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Asunto
              </label>
              <select className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-green-500 focus:outline-none transition-colors">
                <option value="">Selecciona un asunto</option>
                <option value="consulta">Consulta sobre productos</option>
                <option value="pedido">Realizar pedido</option>
                <option value="soporte">Soporte técnico</option>
                <option value="veterinario">Consulta veterinaria</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mensaje
              </label>
              <textarea
                rows="5"
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                placeholder="Cuéntanos en qué podemos ayudarte..."
              />
            </div>

            <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-lg hover:shadow-xl">
              Enviar Mensaje
            </button>
          </div>
        </div>
      </div>

      {/* Mapa o información adicional */}
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Visítanos</h3>
        <p className="text-gray-600 mb-6">
          Te invitamos a conocer nuestra tienda física donde podrás ver todos nuestros productos 
          y recibir asesoría personalizada de nuestros expertos.
        </p>
        <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Mapa interactivo próximamente</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-green-600 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
  {/* Reemplaza la URL a continuación con la URL directa de la imagen que quieres usar */}
  <img src="https://github.com/JoeAnalyst16/Projects/blob/main/patitas%20jpg.jpg?raw=true" alt="Logo de Patitas Salvajes" className="h-16" />
  
  <div>
    <h1 className="text-3xl font-bold text-gray-800">Patitas Salvajes</h1>
    <p className="text-green-600 font-medium">Productos Veterinarios de Calidad</p>
  </div>
</div>
            
            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => setCurrentPage("home")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === "home" 
                    ? "bg-green-100 text-green-700" 
                    : "text-gray-600 hover:text-green-600"
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Inicio</span>
              </button>
              <button
                onClick={() => setCurrentPage("productos")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === "productos" 
                    ? "bg-green-100 text-green-700" 
                    : "text-gray-600 hover:text-green-600"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Productos</span>
              </button>
              <button
                onClick={() => setCurrentPage("contacto")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === "contacto" 
                    ? "bg-green-100 text-green-700" 
                    : "text-gray-600 hover:text-green-600"
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Contacto</span>
              </button>
            </nav>

            <button
              onClick={() =>
                adminMode ? setAdminMode(false) : setShowLogin(true)
              }
              className={`px-4 py-2 rounded-lg transition-colors shadow-md ${
                adminMode
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {adminMode ? "Salir Admin" : "Modo Admin"}
              </div>
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden mt-4 flex justify-center space-x-6">
            <button
              onClick={() => setCurrentPage("home")}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                currentPage === "home" 
                  ? "bg-green-100 text-green-700" 
                  : "text-gray-600"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Inicio</span>
            </button>
            <button
              onClick={() => setCurrentPage("productos")}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                currentPage === "productos" 
                  ? "bg-green-100 text-green-700" 
                  : "text-gray-600"
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs">Productos</span>
            </button>
            <button
              onClick={() => setCurrentPage("contacto")}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                currentPage === "contacto" 
                  ? "bg-green-100 text-green-700" 
                  : "text-gray-600"
              }`}
            >
              <Mail className="w-5 h-5" />
              <span className="text-xs">Contacto</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Admin Mode Indicator */}
      {adminMode && (
        <div className="bg-red-500 text-white text-center py-2 text-sm font-semibold">
          🔒 MODO ADMINISTRADOR ACTIVO
        </div>
      )}

      {/* Modal Login Admin */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowLogin(false);
                setPassword("");
                setError("");
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✖
            </button>
            <div className="flex flex-col items-center mb-6">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <Lock className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Acceso Administrador
              </h2>
              <p className="text-sm text-gray-500 text-center mt-2">
                Ingresa la clave para administrar productos
              </p>
            </div>

            <input
              type="password"
              placeholder="Clave de acceso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-green-500 focus:outline-none mb-3 text-center"
            />

            {error && (
              <div className="flex items-center justify-center gap-2 text-red-600 text-sm mb-3 bg-red-50 p-2 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 shadow-md transition-all font-semibold"
            >
              Ingresar al Panel Admin
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {currentPage === "home" && <HomePage />}
        {currentPage === "productos" && <ProductosPage />}
        {currentPage === "contacto" && <ContactoPage />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-600 p-2 rounded-full">
                  <span className="text-white text-xl">🐾</span>
                </div>
                <h3 className="text-xl font-bold">Patitas Salvajes</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Somos una empresa dedicada al bienestar de tus mascotas, ofreciendo productos 
                veterinarios de la más alta calidad con más de 10 años de experiencia.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700">
                  <span className="text-white text-sm">f</span>
                </div>
                <a href="https://www.instagram.com/farmaciapatitassalvajes?igsh=OHNuYTZsbGp1MWU3" target="_blank" rel="noopener noreferrer">
  <div class="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-700">
    <span class="text-white text-sm">@</span>
  </div>
</a>
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-500">
                  <span className="text-white text-sm">t</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => setCurrentPage("home")} className="hover:text-white transition-colors">Inicio</button></li>
                <li><button onClick={() => setCurrentPage("productos")} className="hover:text-white transition-colors">Productos</button></li>
                <li><button onClick={() => setCurrentPage("contacto")} className="hover:text-white transition-colors">Contacto</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>+56 9 1234 5678</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>contacto@patitassalvajes.cl</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Santiago, Chile</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">© 2025 Patitas Salvajes. Todos los derechos reservados.</p>
            <p className="text-sm text-gray-500 mt-2">Cuidando a tus mascotas con productos de calidad</p>
          </div>
        </div>
        </footer>
    </div>
  );
}

export default App;