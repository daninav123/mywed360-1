import React, { useState } from 'react';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { Plus, Download, Eye, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import Toast from '../components/Toast';
import PageWrapper from '../components/PageWrapper';
import Card from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { uploadEmailAttachments as uploadFiles } from '../services/storageUploadService';
import { useProveedores } from '../hooks/useProveedores';

export default function Contratos() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || 'guest';
  const sampleContracts = [
    { id: 1, provider: 'Eventos Catering', type: 'Catering', signedDate: '2025-04-01', serviceDate: '2025-06-10', status: 'Vigente', docUrl: '#' },
    { id: 2, provider: 'Flores y Diseño', type: 'Flores', signedDate: '2025-03-15', serviceDate: '2025-06-12', status: 'Vigente', docUrl: '#' },
  ];
  const { data: contracts, addItem: addContract, updateItem: updateContract, deleteItem: deleteContract } = useFirestoreCollection('contracts', sampleContracts);
  // selected state keeps ids locally
  const [selected, setSelected] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState(null);
  const initialContract = { provider: '', type: '', signedDate: '', serviceDate: '', status: '', docUrl: '', docFile: null };
  const [newContract, setNewContract] = useState(initialContract);
  const [editContract, setEditContract] = useState(initialContract);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  // Generación de contratos genéricos
  const [showGenericModal, setShowGenericModal] = useState(false);
  const [selectedProvidersForGen, setSelectedProvidersForGen] = useState([]);
  const [genericForm, setGenericForm] = useState({ type: 'Genérico', signedDate: '', serviceDate: '', status: 'Vigente' });
  const { providers = [], loading: providersLoading } = useProveedores();

  const handleAddContract = async e => {
    e.preventDefault();
    let docUrl = newContract.docUrl || '#';
    try {
      if (newContract.docFile) {
        const uploaded = await uploadFiles([newContract.docFile], uid, 'contracts');
        if (uploaded && uploaded[0]?.url) docUrl = uploaded[0].url;
      }
    } catch (err) {
      console.warn('Upload contrato falló, usando URL temporal');
    }
    const { docFile, ...rest } = newContract;
    const contractObj = { id: `ct${Date.now()}`, ...rest, docUrl };
    await addContract(contractObj);
    setNewContract(initialContract);
    setShowAddModal(false);
    setToast({ message: 'Contrato agregado', type: 'success' });
  };

  const isNearExpiry = date => {
    const today = new Date();
    const svc = new Date(date);
    const diff = (svc - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  const toggleSelect = id => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const exportSelected = () => {
    try {
      const rows = [['id','provider','type','signedDate','serviceDate','status','docUrl']];
      contracts.filter(c => selected.includes(c.id)).forEach(c => {
        rows.push([c.id, c.provider, c.type, c.signedDate, c.serviceDate, c.status, c.docUrl]);
      });
      const csv = rows.map(r => r.map(x => `"${String(x||'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contratos.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export CSV error', e);
    }
  };

  const toggleProviderForGen = (id) => {
    setSelectedProvidersForGen(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleGenerateGenericContracts = async (e) => {
    e.preventDefault();
    try {
      const picked = providers.filter(p => selectedProvidersForGen.includes(p.id));
      if (!picked.length) {
        setToast({ message: 'Selecciona al menos un proveedor', type: 'warning' });
        return;
      }
      for (let i = 0; i < picked.length; i++) {
        const p = picked[i];
        const contractObj = {
          id: `ct${Date.now()}_${i}`,
          provider: p?.name || 'Proveedor',
          type: (genericForm.type || '').trim() || p?.service || 'Genérico',
          signedDate: genericForm.signedDate || '',
          serviceDate: genericForm.serviceDate || '',
          status: genericForm.status || 'Vigente',
          docUrl: '#',
        };
        // eslint-disable-next-line no-await-in-loop
        await addContract(contractObj);
      }
      setShowGenericModal(false);
      setSelectedProvidersForGen([]);
      setGenericForm({ type: 'Genérico', signedDate: '', serviceDate: '', status: 'Vigente' });
      setToast({ message: 'Contratos generados', type: 'success' });
    } catch (err) {
      console.error('Error generando contratos genéricos', err);
      setToast({ message: 'Error al generar contratos', type: 'error' });
    }
  };

  const actionButtons = (
    <>
      <button
        onClick={() => setShowAddModal(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
      >
        <Plus size={16} className="mr-2" /> Añadir Contrato
      </button>
      <button
        onClick={() => setShowGenericModal(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center"
      >
        <FileText size={16} className="mr-2" /> Generar contratos
      </button>
      <button
        onClick={exportSelected}
        className="bg-gray-200 px-4 py-2 rounded flex items-center"
      >
        <Download size={16} className="mr-2" /> Exportar Seleccionados
      </button>
    </>
  );

  return (
    <PageWrapper title="Contratos" actions={actionButtons}>
      <Card className="p-6 space-y-6">
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
        
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
            >
              <Plus size={16} className="mr-2" /> Añadir Contrato
            </button>
            <button
              onClick={() => setShowGenericModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center"
            >
              <FileText size={16} className="mr-2" /> Generar contratos
            </button>
            <button
              onClick={exportSelected}
              className="bg-gray-200 px-4 py-2 rounded flex items-center"
            >
              <Download size={16} className="mr-2" /> Exportar Seleccionados
            </button>
          </div>
        {/* Escritorio */}
        <div className="hidden md:block overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2">
                  <input
                    type="checkbox"
                    onChange={e => setSelected(
                      e.target.checked ? contracts.map(c => c.id) : []
                    )}
                  />
                </th>
                <th className="p-2">Proveedor</th>
                <th className="p-2">Tipo de contrato</th>
                <th className="p-2">Fecha de firma</th>
                <th className="p-2">Fecha de servicio</th>
                <th className="p-2">Estado</th>
                <th className="p-2">documento</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(c => (
                <tr
                  key={c.id}
                  className={`${isNearExpiry(c.serviceDate) ? 'bg-yellow-100' : ''} border-b`}
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={() => toggleSelect(c.id)}
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button className="px-2 py-1 border rounded" onClick={() => { setEditContract(c); setShowEditModal(true); }}>Editar</button>
                      <button className="px-2 py-1 border rounded" onClick={async () => {
                        const clone = { ...c, id: `ct${Date.now()}` };
                        await addContract(clone);
                        setToast({ message: 'Contrato duplicado', type: 'success' });
                      }}>Duplicar</button>
                    </div>
                  </td>
                  <td className="p-2">{c.provider}</td>
                  <td className="p-2">{c.type}</td>
                  <td className="p-2">{c.signedDate}</td>
                  <td className="p-2">{c.serviceDate}</td>
                  <td className="p-2">{c.status}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={c.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600"
                      >
                        <Eye size={16} className="mr-1" /> Ver
                      </a>
                      {c.docUrl && c.docUrl.toLowerCase().includes('.pdf') && (
                        <button
                          className="px-2 py-1 border rounded text-xs"
                          onClick={()=>{ setPdfUrl(c.docUrl); setShowPdfModal(true); }}
                        >Abrir</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Móvil */}
        <div className="block md:hidden space-y-4">
          {contracts.map(c => (
            <ContractItem
              key={c.id}
              contract={c}
              isSelected={selected.includes(c.id)}
              onToggle={() => toggleSelect(c.id)}
            />
          ))}
        </div>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-xl font-semibold mb-4">Añadir Contrato</h2>
            <form onSubmit={handleAddContract} className="space-y-3">
              <input
                type="text"
                placeholder="Proveedor"
                value={newContract.provider}
                onChange={e => setNewContract({ ...newContract, provider: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <input
                type="text"
                placeholder="Tipo de contrato"
                value={newContract.type}
                onChange={e => setNewContract({ ...newContract, type: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <input
                type="date"
                value={newContract.signedDate}
                onChange={e => setNewContract({ ...newContract, signedDate: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <input
                type="date"
                value={newContract.serviceDate}
                onChange={e => setNewContract({ ...newContract, serviceDate: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <select
                value={newContract.status}
                onChange={e => setNewContract({ ...newContract, status: e.target.value })}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">Seleccionar estado</option>
                <option value="Vigente">Vigente</option>
                <option value="Expirado">Expirado</option>
              </select>
              <div>
                <label className="block mb-1">documento</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={e => {
                    const file = e.target.files[0];
                    setNewContract({ ...newContract, docFile: file, docUrl: file ? URL.createObjectURL(file) : '' });
                  }}
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-xl font-semibold mb-4">Editar Contrato</h2>
            <form onSubmit={async (e)=>{ e.preventDefault(); await updateContract(editContract.id, editContract); setShowEditModal(false); setToast({ message: 'Contrato actualizado', type: 'success' }); }} className="space-y-3">
              <input type="text" placeholder="Proveedor" value={editContract.provider} onChange={e=>setEditContract({ ...editContract, provider: e.target.value })} className="w-full border rounded px-2 py-1" required />
              <input type="text" placeholder="Tipo de contrato" value={editContract.type} onChange={e=>setEditContract({ ...editContract, type: e.target.value })} className="w-full border rounded px-2 py-1" required />
              <input type="date" value={editContract.signedDate} onChange={e=>setEditContract({ ...editContract, signedDate: e.target.value })} className="w-full border rounded px-2 py-1" required />
              <input type="date" value={editContract.serviceDate} onChange={e=>setEditContract({ ...editContract, serviceDate: e.target.value })} className="w-full border rounded px-2 py-1" required />
              <select value={editContract.status} onChange={e=>setEditContract({ ...editContract, status: e.target.value })} className="w-full border rounded px-2 py-1">
                <option value="Vigente">Vigente</option>
                <option value="Expirado">Expirado</option>
                <option value="Señal pagada">Señal pagada</option>
              </select>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGenericModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-[90vw] max-w-3xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText size={18} className="mr-2" /> Generar contratos genéricos
            </h2>
            <form onSubmit={handleGenerateGenericContracts} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Tipo de contrato</label>
                  <input
                    type="text"
                    value={genericForm.type}
                    onChange={e => setGenericForm({ ...genericForm, type: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                    placeholder="Genérico / Catering / Foto..."
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Estado</label>
                  <select
                    value={genericForm.status}
                    onChange={e => setGenericForm({ ...genericForm, status: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="Vigente">Vigente</option>
                    <option value="Expirado">Expirado</option>
                    <option value="Señal pagada">Señal pagada</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Fecha de firma</label>
                  <input
                    type="date"
                    value={genericForm.signedDate}
                    onChange={e => setGenericForm({ ...genericForm, signedDate: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Fecha de servicio</label>
                  <input
                    type="date"
                    value={genericForm.serviceDate}
                    onChange={e => setGenericForm({ ...genericForm, serviceDate: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Selecciona proveedores</label>
                <div className="border rounded max-h-64 overflow-auto divide-y">
                  {providersLoading ? (
                    <div className="p-3 text-sm text-gray-500">Cargando proveedores...</div>
                  ) : providers.length ? (
                    providers.map(p => (
                      <label key={p.id} className="flex items-center gap-3 p-2">
                        <input
                          type="checkbox"
                          checked={selectedProvidersForGen.includes(p.id)}
                          onChange={() => toggleProviderForGen(p.id)}
                        />
                        <div>
                          <div className="font-medium">{p.name || 'Proveedor'}</div>
                          <div className="text-xs text-gray-500">{p.service || 'Servicio'}</div>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-gray-500">No hay proveedores disponibles.</div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowGenericModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Generar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPdfModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-[90vw] max-w-3xl h-[85vh] relative">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="font-semibold">Documento</div>
              <button className="px-2 py-1 border rounded" onClick={()=> setShowPdfModal(false)}>Cerrar</button>
            </div>
            <div className="w-full h-[calc(85vh-48px)]">
              <iframe title="PDF" src={pdfUrl} className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

function ContractItem({ contract, isSelected, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded p-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold">{contract.provider}</p>
          <p className="text-sm text-gray-600">{contract.type} - {contract.status}</p>
        </div>
        <button onClick={() => setOpen(v => !v)}>
          {open ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>
      {open && (
        <div className="mt-2 space-y-2">
          <p>Fecha de firma: {contract.signedDate}</p>
          <p>Fecha de servicio: {contract.serviceDate}</p>
          <a href={contract.docUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600">
            <Eye size={16} className="mr-1" /> Ver documento
          </a>
          <div>
            <input type="checkbox" checked={isSelected} onChange={onToggle} /> Seleccionar
          </div>
        </div>
      )}
    </div>
  );
}


