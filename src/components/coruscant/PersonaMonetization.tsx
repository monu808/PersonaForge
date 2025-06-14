import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  CreditCard, 
  Star,
  Trophy,
  Gift,
  Users,
  TrendingUp,
  Calendar,
  Video,
  Music,
  MessageCircle,
  Shield,
  Plus,
  Settings,
  Eye,
  Download
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Replica {
  id: string;
  name: string;
  status: string;
  type: string;
}

interface PersonaMonetizationProps {
  replicas: Replica[];
}

interface MonetizationProduct {
  id: string;
  title: string;
  description: string;
  type: 'subscription' | 'nft' | 'event' | 'content' | 'service';
  price: number;
  currency: 'USD' | 'ALGO';
  replica_id: string;
  status: 'active' | 'draft' | 'sold_out';
  sales_count: number;
  revenue: number;
}

interface RevenueStats {
  total_revenue: number;
  monthly_revenue: number;
  active_subscribers: number;
  nft_sales: number;
  event_attendees: number;
}

const productTypes = [
  { value: 'subscription', label: 'Monthly Subscription', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'nft', label: 'NFT Collectible', icon: <Star className="h-4 w-4" /> },
  { value: 'event', label: 'Premium Event', icon: <Calendar className="h-4 w-4" /> },
  { value: 'content', label: 'Premium Content', icon: <Video className="h-4 w-4" /> },
  { value: 'service', label: 'Personal Service', icon: <MessageCircle className="h-4 w-4" /> }
];

const currencyOptions = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'ALGO', label: 'Algorand (ALGO)', symbol: '◎' }
];

export default function PersonaMonetization({ replicas }: PersonaMonetizationProps) {
  const [products, setProducts] = useState<MonetizationProduct[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MonetizationProduct | null>(null);
  
  // Mock revenue stats
  const [revenueStats] = useState<RevenueStats>({
    total_revenue: 0,
    monthly_revenue: 0,
    active_subscribers: 0,
    nft_sales: 0,
    event_attendees: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    price: 0,
    currency: 'USD',
    replicaId: ''
  });

  const createProduct = () => {
    if (!formData.title || !formData.type || !formData.replicaId || formData.price <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const newProduct: MonetizationProduct = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      type: formData.type as any,
      price: formData.price,
      currency: formData.currency as any,
      replica_id: formData.replicaId,
      status: 'active',
      sales_count: 0,
      revenue: 0
    };

    setProducts(prev => [newProduct, ...prev]);
    setShowCreateForm(false);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      type: '',
      price: 0,
      currency: 'USD',
      replicaId: ''
    });

    toast({
      title: "Product Created",
      description: `"${formData.title}" is now available for purchase.`,
    });
  };

  const toggleProductStatus = (productId: string) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, status: product.status === 'active' ? 'draft' : 'active' }
        : product
    ));
  };

  const viewAnalytics = (product: MonetizationProduct) => {
    setSelectedProduct(product);
    toast({
      title: "Analytics",
      description: `Viewing analytics for "${product.title}"`,
    });
  };

  const getCurrencySymbol = (currency: string) => {
    return currencyOptions.find(c => c.value === currency)?.symbol || '$';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Monetize Your Personas
            </h2>
            <p className="text-muted-foreground">
              Generate revenue through subscriptions, NFTs, and premium services
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Product
        </Button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${revenueStats.total_revenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">${revenueStats.monthly_revenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{revenueStats.active_subscribers}</p>
                <p className="text-xs text-muted-foreground">Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{revenueStats.nft_sales}</p>
                <p className="text-xs text-muted-foreground">NFT Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{revenueStats.event_attendees}</p>
                <p className="text-xs text-muted-foreground">Event Attendees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Product Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Monetization Product</CardTitle>
            <p className="text-sm text-muted-foreground">
              Set up a new revenue stream for your persona
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Title</label>
                <Input
                  placeholder="Enter product title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Persona</label>
                <Select 
                  value={formData.replicaId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, replicaId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {replicas.filter(r => r.status === 'active').map((replica) => (
                      <SelectItem key={replica.id} value={replica.id}>
                        {replica.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Product Type</label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Price</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                  <Select 
                    value={formData.currency} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe what customers will receive..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={createProduct}>
                <DollarSign className="h-4 w-4 mr-2" />
                Create Product
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products List */}
      {products.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Products</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your monetization products and services
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product) => {
                const replica = replicas.find(r => r.id === product.replica_id);
                const productType = productTypes.find(t => t.value === product.type);
                
                return (
                  <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white">
                      {productType?.icon || <DollarSign className="h-6 w-6" />}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{product.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {replica?.name} • {productType?.label}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : product.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.status}
                        </span>
                        <span className="text-sm font-semibold">
                          {getCurrencySymbol(product.currency)}{product.price}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {product.sales_count} sales • {getCurrencySymbol(product.currency)}{product.revenue} revenue
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => viewAnalytics(product)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleProductStatus(product.id)}
                      >
                        {product.status === 'active' ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <Settings className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No Products Yet</h3>
              <p className="text-muted-foreground">
                Create your first monetization product to start generating revenue
              </p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Product
            </Button>
          </div>
        </Card>
      )}

      {/* Integration Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RevenueCat Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              RevenueCat Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Set up recurring subscriptions for premium persona access
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Basic Plan</span>
                <span className="font-semibold">$9.99/month</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Premium Plan</span>
                <span className="font-semibold">$19.99/month</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">VIP Plan</span>
                <span className="font-semibold">$49.99/month</span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configure RevenueCat
            </Button>
          </CardContent>
        </Card>

        {/* Algorand NFTs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Algorand NFT Collections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Create and sell unique NFT collectibles of your personas
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Profile Picture NFTs</span>
                <span className="font-semibold">◎ 50 ALGO</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Exclusive Videos</span>
                <span className="font-semibold">◎ 100 ALGO</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Limited Edition</span>
                <span className="font-semibold">◎ 500 ALGO</span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <Trophy className="h-4 w-4 mr-2" />
              Create NFT Collection
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Monetization Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monetization Ideas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Video className="h-4 w-4 text-blue-500" />
                Exclusive Content
              </h4>
              <p className="text-sm text-gray-600">
                Premium videos, songs, and content only for subscribers
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-500" />
                Personal Services
              </h4>
              <p className="text-sm text-gray-600">
                1-on-1 consultations, personalized messages, custom content
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                Premium Events
              </h4>
              <p className="text-sm text-gray-600">
                VIP access to live events, exclusive Q&As, private sessions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
