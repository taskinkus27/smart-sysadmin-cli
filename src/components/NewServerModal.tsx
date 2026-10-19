import React, { useState } from 'react';
import { X, Server, Key, Lock, Check } from 'lucide-react';

interface NewServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddServer: (data: {
    name: string;
    host: string;
    port: number;
    username: string;
    authType: 'password' | 'key';
    isReal: boolean;
  }) => void;
}

export const NewServerModal: React.FC<NewServerModalProps> = ({
  isOpen,
  onClose,
  onAddServer,
}) => {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState('root');
  const [authType, setAuthType] = useState<'password' | 'key'>('key');
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isReal, setIsReal] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!host) return;

    onAddServer({
      name: name.trim() || host.trim(),
      host: host.trim(),
      port,
      username: username.trim(),
      authType,
      isReal,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">Yeni Linux SSH Sunucusu Ekle</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Sunucu Tanım Adı (Label)
            </label>
            <input
              type="text"
              placeholder="Örn: prod-api-cluster, hetzner-vps-01"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">
                IP Adresi veya Hostname *
              </label>
              <input
                type="text"
                required
                placeholder="192.168.1.10 veya node.example.com"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Port</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">SSH Kullanıcısı</label>
              <input
                type="text"
                required
                placeholder="root veya ubuntu veya debian"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Kimlik Doğrulama</label>
              <select
                value={authType}
                onChange={(e) => setAuthType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none font-mono"
              >
                <option value="key">SSH Private Key (Önerilen)</option>
                <option value="password">Şifre (Password)</option>
              </select>
            </div>
          </div>

          {authType === 'password' ? (
            <div>
              <label className="block font-semibold text-slate-300 mb-1">SSH Şifresi</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                SSH Private Key (id_rsa / id_ed25519)
              </label>
              <textarea
                rows={3}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          )}

          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200 block">Gerçek SSH Bağlantısı</span>
              <span className="text-[11px] text-slate-500">
                Açık olduğunda komutlar doğrudan sunucu IP'sine SSH üzerinden iletilir
              </span>
            </div>
            <input
              type="checkbox"
              checked={isReal}
              onChange={(e) => setIsReal(e.target.checked)}
              className="rounded border-slate-700 text-emerald-500 focus:ring-0"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md transition"
            >
              Sunucuyu Ekle & Bağlan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
