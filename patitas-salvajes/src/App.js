import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Save, Upload, Package, Check, X, Edit, Trash2, Plus, Lock, 
  AlertTriangle, Home, ShoppingBag, Mail, Phone, MapPin, Clock, 
  Star, Loader, Image as ImageIcon, Search, Filter
} from "lucide-react";
import { 
  collection, addDoc, getDocs, deleteDoc, doc, 
  updateDoc, onSnapshot, query, orderBy 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
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
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  const ADMIN_KEY = "Patitassalvajes1996*";

  const categories = [
    { id: "todos", name: "Todos los productos" },
    { id: "alimento", name: "Alimentos" },
    { id: "medicina", name: "Medicinas" },
    { id: "juguetes", name: "Juguetes" },
    { id: "accesorios", name: "Accesorios" },
    { id: "higiene", name: "Higiene" }
  ];

  // Notificaciones automáticas
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // Cargar productos desde Firestore en tiempo real
  useEffect(() => {
    const productsCollection = collection(db, "products");
    const q = query(productsCollection, orderBy("name", "asc"));
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const productsData = querySnapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setProducts(productsData);
        setLoading(false);
      }, 
      (error) => {
        console.error("Error al cargar los productos:", error);
        setNotification({ 
          show: true, 
          message: "Error al cargar productos", 
          type: "error" 
        });
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Función optimizada para subir imagen
  const handleImageUpload = useCallback(async (file) => {
    if (!file) return;
    
    // Validar tipo y tamaño
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setNotification({ 
        show: true, 
        message: "Por favor sube una imagen válida (JPG, PNG, GIF, WEBP)", 
        type: "error" 
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setNotification({ 
        show: true, 
        message: "La imagen no debe superar los 5MB", 
        type: "error" 
      });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const storageRef = ref(storage, `images/${fileName}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, image: imageUrl }));
      setNotification({ 
        show: true, 
        message: "Imagen subida correctamente", 
        type: "success" 
      });
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      setNotification({ 
        show: true, 
        message: "Error al subir la imagen", 
        type: "error" 
      });
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDeleteImage = useCallback(async () => {
    if (!formData.image) return;
    
    try {
      const imageRef = ref(storage, formData.image);
      await deleteObject(imageRef);
      setFormData(prev => ({ ...prev, image: "" }));
      setNotification({ 
        show: true, 
        message: "Imagen eliminada", 
        type: "success" 
      });
    } catch (error) {
      console.error("Error al eliminar la imagen:", error);
      setFormData(prev => ({ ...prev, image: "" }));
    }
  }, [formData.image]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price) {
      setNotification({ 
        show: true, 
        message: "Por favor completa todos los campos obligatorios", 
        type: "error" 
      });
      return;
    }

    setSaving(true);
    try {
      const productData = {
        ...formData,
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), productData);
        setNotification({ 
          show: true, 
          message: "Producto actualizado correctamente", 
          type: "success" 
        });
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: new Date().toISOString()
        });
        setNotification({ 
          show: true, 
          message: "Producto creado correctamente", 
          type: "success" 
        });
      }

      // Resetear formulario
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
    } catch (error) {
      console.error("Error al guardar el producto:", error);
      setNotification({ 
        show: true, 
        message: "Error al guardar el producto", 
        type: "error" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = useCallback((product) => {
    setFormData({
      name: product.name || "",
      price: product.price || "",
      description: product.description || "",
      image: product.image || "",
      stock: product.stock || 0,
      inStock: product.inStock !== false,
      category: product.category || "alimento"
    });
    setEditingProduct(product);
    setShowForm(true);
    setCurrentPage("productos");
    window.scrollTo(0, 0);
  }, []);

  const handleDelete = useCallback(async (id, productName) => {
    if (window.confirm(`¿Estás seguro de eliminar "${productName}"?`)) {
      try {
        await deleteDoc(doc(db, "products", id));
        setNotification({ 
          show: true, 
          message: "Producto eliminado", 
          type: "success" 
        });
      } catch (error) {
        console.error("Error al eliminar el producto:", error);
        setNotification({ 
          show: true, 
          message: "Error al eliminar el producto", 
          type: "error" 
        });
      }
    }
  }, []);

  const toggleStock = useCallback(async (id, currentStock) => {
    try {
      await updateDoc(doc(db, "products", id), {
        inStock: !currentStock,
        updatedAt: new Date().toISOString()
      });
      setNotification({ 
        show: true, 
        message: `Stock ${!currentStock ? 'habilitado' : 'deshabilitado'}`, 
        type: "success" 
      });
    } catch (error) {
      console.error("Error al actualizar el stock:", error);
      setNotification({ 
        show: true, 
        message: "Error al actualizar el stock", 
        type: "error" 
      });
    }
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_KEY) {
      setAdminMode(true);
      setShowLogin(false);
      setPassword("");
      setError("");
      setNotification({ 
        show: true, 
        message: "Sesión de administrador iniciada", 
        type: "success" 
      });
    } else {
      setError("Clave incorrecta, intenta de nuevo.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleLogout = () => {
    setAdminMode(false);
    setShowForm(false);
    setEditingProduct(null);
    setNotification({ 
      show: true, 
      message: "Sesión cerrada", 
      type: "info" 
    });
  };

  // Filtrado optimizado con useMemo
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower);
      const matchesCategory = 
        selectedCategory === "todos" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const HomePage = () => (
    <div className="space-y-16 animate-fadeIn">
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

      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all transform hover:-translate-y-1">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold mb-3">Calidad Premium</h3>
          <p className="text-gray-600">Productos de la más alta calidad para el cuidado integral de tus mascotas.</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all transform hover:-translate-y-1">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-3">Entrega Rápida</h3>
          <p className="text-gray-600">Servicio de entrega eficiente para que tu mascota no espere.</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all transform hover:-translate-y-1">
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold mb-3">Amplio Catálogo</h3>
          <p className="text-gray-600">Desde alimentos hasta medicinas, todo lo que necesitas en un solo lugar.</p>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Productos Destacados</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {products.slice(0, 3).map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1">
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
                <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
              </div>
            </div>
          ))}
        </div>
        {products.length > 3 && (
          <div className="text-center mt-8">
            <button
              onClick={() => setCurrentPage("productos")}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Ver Todos los Productos
            </button>
          </div>
        )}
      </section>
    </div>
  );

  const ProductosPage = () => (
    <div className="space-y-8 animate-fadeIn">
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

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Search className="inline w-4 h-4 mr-1" />
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
              <Filter className="inline w-4 h-4 mr-1" />
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
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
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
                  required
                  maxLength={100}
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
                    min="0"
                    step="0.01"
                    required
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
                  min="0"
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
                  {uploading ? (
                    <div className="py-8">
                      <Loader className="w-8 h-8 animate-spin text-green-500 mx-auto" />
                      <p className="text-sm text-gray-600 mt-2">Subiendo imagen...</p>
                    </div>
                  ) : formData.image ? (
                    <div className="space-y-3">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-32 h-32 object-cover mx-auto rounded-lg shadow-md"
                      />
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Eliminar imagen
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Haz clic para subir una imagen</p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WEBP (Max. 5MB)</p>
                    </div>
                  )}
                  {!uploading && (
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => handleImageUpload(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploading}
                    />
                  )}
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
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/500 caracteres
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t mt-6">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingProduct ? "Actualizar Producto" : "Crear Producto"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingProduct(null);
                setFormData({ 
                  name: "", 
                  price: "", 
                  description: "", 
                  image: "", 
                  stock: 0, 
                  inStock: true, 
                  category: "alimento" 
                });
              }}
              className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-10 h-10 animate-spin text-green-500" />
          <p className="ml-4 text-gray-500">Cargando productos...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500">
                {searchTerm || selectedCategory !== "todos" 
                  ? "No se encontraron productos con los filtros aplicados" 
                  : "No hay productos disponibles"}
              </p>
              <p className="text-gray-400 mt-2">
                {adminMode && !searchTerm && selectedCategory === "todos"
                  ? 'Agrega tu primer producto haciendo clic en "Nuevo Producto"' 
                  : searchTerm || selectedCategory !== "todos"
                  ? 'Intenta con otros términos de búsqueda o categorías'
                  : 'Pronto tendremos productos disponibles'}
              </p>
            </div>
          )}
          
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border transition-all hover:shadow-xl transform hover:-translate-y-1 ${
                !product.inStock ? 'opacity-75 border-red-200' : 'border-gray-200'
              }`}
            >
              <div className="relative h-48 bg-gray-100">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-16 h-16 text-gray-300" />
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
              
              {/* --- START OF MISSING CODE --- */}
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2 truncate" title={product.name}>{product.name}</h3>
                <p className="text-2xl font-bold text-green-600 mb-3">${new Intl.NumberFormat('es-CL').format(product.price)}</p>
                <p className="text-gray-600 text-sm h-10 line-clamp-2">{product.description || "Sin descripción."}</p>
              </div>

              {adminMode && (
                <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Editar Producto">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id, product.name)} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors" title="Eliminar Producto">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => toggleStock(product.id, product.inStock)} className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 transition-colors ${product.inStock ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`} title={product.inStock ? "Marcar como 'Sin Stock'" : "Marcar como 'Disponible'"}>
                    {product.inStock ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    <span>{product.inStock ? 'Deshabilitar' : 'Habilitar'}</span>
                  </button>
                </div>
              )}
               {/* --- END OF MISSING CODE --- */}

            </div>
          ))}
        </div>
      )}
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
      <header className="bg-white shadow-lg border-b-4 border-green-600 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="https://github.com/JoeAnalyst16/Projects/blob/main/patitas%20jpg.jpg?raw=true" alt="Logo de Patitas Salvajes" className="h-16" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Patitas Salvajes</h1>
                <p className="text-green-600 font-medium">Productos Veterinarios de Calidad</p>
              </div>
            </div>
            
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
                adminMode ? handleLogout() : setShowLogin(true)
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

      {adminMode && (
        <div className="bg-red-500 text-white text-center py-2 text-sm font-semibold">
          🔒 MODO ADMINISTRADOR ACTIVO
        </div>
      )}

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

      <main className="max-w-6xl mx-auto p-6">
        {currentPage === "home" && <HomePage />}
        {currentPage === "productos" && <ProductosPage />}
        {currentPage === "contacto" && <ContactoPage />}
      </main>

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
                <a
                  href="https://www.instagram.com/farmaciapatitassalvajes?igsh=OHNuYTZsbGp1MWU3"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-700">
                    <span className="text-white text-sm">@</span>
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