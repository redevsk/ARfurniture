import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Box, Wand2, Send, Smartphone, Truck, RefreshCw, ShieldCheck } from 'lucide-react';
import { Product } from '../../types';
import { db } from '../../services/db';
import { generateProductDescription, askProductAssistant } from '../../services/gemini';
import { useCart } from '../../App';
import { ModelViewerWrapper } from '../../components/ModelViewerWrapper';
import { QRCodeModal } from '../../components/QRCodeModal';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | undefined>();
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiDescription, setAiDescription] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const { addToCart } = useCart();
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  
  // Chat state
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        setLoading(true);
        // Fetch current product and all products for recommendations
        const [currentProduct, allProducts] = await Promise.all([
            db.getProductById(id),
            db.getProducts()
        ]);

        setProduct(currentProduct);

        if (currentProduct) {
            // Filter related products: Same category, exclude current
            const related = allProducts
                .filter(p => p.category === currentProduct.category && p._id !== currentProduct._id)
                .slice(0, 4);
            
            // If we don't have enough same-category items, fill with others
            if (related.length < 4) {
                const others = allProducts
                    .filter(p => p._id !== currentProduct._id && !related.find(r => r._id === p._id))
                    .slice(0, 4 - related.length);
                setRelatedProducts([...related, ...others]);
            } else {
                setRelatedProducts(related);
            }
        }
        
        // Reset state for new product
        setAiDescription('');
        setChatAnswer('');
        setChatQuestion('');
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleGenerateDescription = async () => {
    if (!product) return;
    setIsGeneratingAi(true);
    const desc = await generateProductDescription(product.name, `${product.category}, ${product.description}`);
    setAiDescription(desc);
    setIsGeneratingAi(false);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!product || !chatQuestion.trim()) return;
      
      setIsChatting(true);
      const answer = await askProductAssistant(chatQuestion, product);
      setChatAnswer(answer);
      setIsChatting(false);
  }

  if (loading || !product) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Left Column: AR Viewer */}
        <div className="h-[500px] lg:h-[600px] bg-slate-100 rounded-2xl shadow-inner relative">
          <ModelViewerWrapper 
            src={product.arModelUrl}
            poster={product.imageUrl}
            alt={`3D model of ${product.name}`}
          />
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Box className="w-4 h-4" />
            <span>Rotate to view 360° • Tap AR button to view in room</span>
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col h-full">
          <div className="mb-auto">
            <span className="text-indigo-600 font-medium text-sm tracking-wider uppercase">{product.category}</span>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-2">{product.name}</h1>
            <div className="text-4xl font-bold text-slate-900 mb-8">${product.price}</div>

            {/* Description Area */}
            <div className="prose prose-slate mb-8">
              <p className="text-lg text-slate-600 leading-relaxed">
                {aiDescription || product.description}
              </p>
              
              {/* AI Generator Button */}
              {!aiDescription && (
                <button 
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingAi}
                  className="mt-3 inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-bold transition-colors"
                >
                  <Wand2 className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  {isGeneratingAi ? 'Dreaming up description...' : 'Enhance with AI'}
                </button>
              )}
            </div>

            {/* Specs */}
            <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Dimensions</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Width</div>
                  <div className="font-mono text-slate-700">{product.dimensions.width} {product.dimensions.unit}</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Height</div>
                  <div className="font-mono text-slate-700">{product.dimensions.height} {product.dimensions.unit}</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Depth</div>
                  <div className="font-mono text-slate-700">{product.dimensions.depth} {product.dimensions.unit}</div>
                </div>
              </div>
            </div>
            
             {/* AI Chat Assistant */}
             <div className="bg-indigo-50/50 rounded-xl p-5 mb-8 border border-indigo-100">
                <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                    <Wand2 className="w-4 h-4"/> Ask about this product
                </h3>
                {chatAnswer && (
                    <div className="mb-4 p-3 bg-white rounded-lg text-sm text-slate-700 shadow-sm border border-indigo-50">
                        {chatAnswer}
                    </div>
                )}
                <form onSubmit={handleChatSubmit} className="flex gap-3">
                    <input 
                        type="text" 
                        value={chatQuestion}
                        onChange={e => setChatQuestion(e.target.value)}
                        placeholder="e.g., Will this fit in a small room?"
                        className="flex-1 text-sm px-4 py-3 rounded-lg bg-slate-800 text-white placeholder:text-slate-400 border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                    <button 
                        type="submit" 
                        disabled={isChatting || !chatQuestion}
                        className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-all hover:scale-105"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
             </div>

             {/* Policies Section */}
             <div className="border-t border-slate-200 pt-6 space-y-5 mb-8">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                        <Truck className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">Shipping Costs</h4>
                        <p className="text-sm text-slate-500 leading-snug">
                            Free standard shipping on all orders over $500. Expedited options available calculated at checkout.
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                        <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">Returns & Cancellations</h4>
                        <p className="text-sm text-slate-500 leading-snug">
                            Return within 30 days for a full refund. Cancel anytime before shipping for no charge.
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">Warranty Details</h4>
                        <p className="text-sm text-slate-500 leading-snug">
                            Includes a 3-year comprehensive warranty covering manufacturing defects and structural integrity.
                        </p>
                    </div>
                </div>
             </div>

          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-slate-200 mt-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => addToCart(product)}
                className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-slate-900/20"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>

              {/* Mobile/Desktop AR Trigger */}
              <button 
                onClick={() => setIsQRModalOpen(true)}
                className="flex-1 sm:flex-none sm:w-auto bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-5 h-5" />
                <span className="hidden sm:inline">Scan for </span>AR
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* You May Also Like Section */}
      <div className="border-t border-slate-200 pt-12 pb-12">
        <h2 className="text-2xl font-bold text-slate-900 font-serif mb-8">You may also like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rp) => (
                <Link 
                  key={rp._id}
                  to={`/product/${rp._id}`}
                  className="group block bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
                >
                  <div className="aspect-square overflow-hidden bg-slate-100 relative">
                    <img 
                      src={rp.imageUrl} 
                      alt={rp.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    {rp.isNewArrival && (
                        <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">New</span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <p className="text-xs text-slate-500 mb-1">{rp.category}</p>
                    <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">{rp.name}</h3>
                    <div className="mt-auto pt-2">
                        <p className="text-lg font-semibold text-slate-900">${rp.price}</p>
                    </div>
                  </div>
                </Link>
            ))}
        </div>
      </div>

      {/* QR Code Modal for AR */}
      <QRCodeModal 
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />
    </div>
  );
};