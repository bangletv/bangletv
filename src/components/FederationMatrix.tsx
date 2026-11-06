import { useState } from 'react';
import { Network, Search, AlertCircle } from 'lucide-react';
import { CommunityNode, FederationRelationship } from '../types/broadcast';
import { INITIAL_COMMUNITY_NODES } from '../data/federationData';

export default function FederationMatrix() {
  const [nodes, setNodes] = useState<CommunityNode[]>(INITIAL_COMMUNITY_NODES);
  const [filterRel, setFilterRel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleUpdateRelationship = (nodeId: string, newRel: FederationRelationship) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, relationship: newRel, lastSync: 'Just now' } : n))
    );
  };

  const filteredNodes = nodes.filter((n) => {
    const matchesSearch =
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.region.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRel === 'all' ? true : n.relationship === filterRel;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-8 py-8 text-[#1D1D1F]">
      {/* Header */}
      <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[#0066CC] text-xs font-semibold mb-1.5">
              <Network size={15} />
              <span>Decentralized Community Broadcast Nodes · §§4, 9 & 10</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight">
              Federation Node Matrix
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6E73] mt-1.5 max-w-2xl leading-relaxed">
              Voluntary permission-based federation across regional Bengali, North American, and European community news desks.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#F5F5F7] border border-[#E5E5EA] px-4 py-3 rounded-xl text-center">
              <div className="text-[10px] font-medium text-[#6E6E73] uppercase">Active Desks</div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#1D1D1F] mt-0.5">
                {nodes.length}
              </div>
            </div>
            <div className="bg-[#F5F5F7] border border-[#E5E5EA] px-4 py-3 rounded-xl text-center">
              <div className="text-[10px] font-medium text-[#6E6E73] uppercase">Policy</div>
              <div className="text-xs font-bold text-[#1F7A3F] mt-1">Consent-First</div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[#E5E5EA] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" size={14} />
            <input
              type="text"
              placeholder="Search community node or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl pl-9 pr-4 py-2 text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#0066CC] focus:bg-white"
            />
          </div>

          <div className="inline-flex bg-[#EFEFF4] p-1 rounded-xl text-xs">
            {['all', 'ALLOW', 'FOLLOW', 'BLOCK'].map((rel) => (
              <button
                key={rel}
                type="button"
                onClick={() => setFilterRel(rel)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterRel === rel
                    ? 'bg-white text-[#1D1D1F] shadow-2xs'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                {rel === 'all' ? 'All Nodes' : rel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNodes.map((node) => (
          <div
            key={node.id}
            className={`bg-white border rounded-2xl p-6 transition-all shadow-2xs ${
              node.isReferenceNode
                ? 'border-[#0066CC]/50 ring-1 ring-[#0066CC]/15'
                : 'border-[#E5E5EA] hover:border-[#D2D2D7]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F]">{node.name}</h3>
                <div className="text-xs text-[#6E6E73] mt-0.5">
                  {node.domain} · {node.region}
                  {node.isReferenceNode ? ' · Reference Desk' : ''}
                </div>
              </div>

              <span
                className={`text-[11px] font-mono font-bold ${
                  node.relationship === 'ALLOW'
                    ? 'text-[#1F7A3F]'
                    : node.relationship === 'BLOCK'
                    ? 'text-[#D70015]'
                    : 'text-[#0066CC]'
                }`}
              >
                {node.relationship}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E5EA] text-xs text-[#6E6E73]">
              Operator: <strong className="text-[#1D1D1F]">{node.operator}</strong>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E5EA] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-[11px] font-mono tabular-nums text-[#6E6E73]">
                {node.totalChannels} channels · {node.activeStreams} live · {node.trustScore}% trust
              </div>

              <div className="inline-flex bg-[#EFEFF4] p-1 rounded-xl">
                {(['ALLOW', 'FOLLOW', 'BLOCK'] as const).map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => handleUpdateRelationship(node.id, rel)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      node.relationship === rel
                        ? 'bg-white text-[#1D1D1F] shadow-2xs'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {rel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Constitutional Principle Notice */}
      <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 text-xs text-[#6E6E73] flex items-start gap-3">
        <AlertCircle className="text-[#0066CC] shrink-0 mt-0.5" size={18} />
        <div>
          <div className="font-bold text-[#1D1D1F]">
            §10 Federation Is Not Unconsented Redistribution
          </div>
          <p className="mt-1 leading-relaxed">
            Discovery across federated desks preserves local community ownership and editorial autonomy. Revoking federation immediately halts cross-community stream discovery.
          </p>
        </div>
      </div>
    </div>
  );
}
