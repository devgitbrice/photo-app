"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface NodeLink {
  id: string;
  title: string;
  doc_type: string;
  url?: string; // For external URL links
}

interface SearchResult {
  id: string;
  title: string;
  doc_type: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  doc: "Doc",
  python: "Python",
  table: "Table",
  mindmap: "Mindmap",
  presentation: "Présentation",
  scan: "PDF",
  url: "URL",
};

function isUrl(str: string): boolean {
  try {
    const trimmed = str.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      new URL(trimmed);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function getLinkHref(link: NodeLink): string | null {
  if (link.doc_type === "url" && link.url) return link.url;
  switch (link.doc_type) {
    case "python": return `/editpython/${link.id}`;
    case "doc": return `/editdoc/${link.id}`;
    case "table": return `/edittable/${link.id}`;
    case "mindmap": return `/editmindmap/${link.id}`;
    case "presentation": return `/editpresentation/${link.id}`;
    default: return null;
  }
}

export default function MindMapNode({ data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  // Link search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const links: NodeLink[] = data.links || [];

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Close search when clicking outside
  useEffect(() => {
    if (!showSearch) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as HTMLElement)) {
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearch]);

  const finishEditing = () => {
    setIsEditing(false);
    data.label = label;
  };

  const onKeyDown = (evt: React.KeyboardEvent) => {
    if (evt.key === "Enter") {
      finishEditing();
    }
  };

  // Search for MyDrive items
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    // Don't search if it's a URL
    if (isUrl(query)) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data: results, error } = await supabase
        .from("MyDrive")
        .select("id, title, doc_type")
        .ilike("title", `%${query}%`)
        .limit(8);

      if (!error && results) {
        const existingIds = new Set(links.map((l) => l.id));
        setSearchResults(
          results
            .filter((r: any) => !existingIds.has(r.id))
            .map((r: any) => ({
              id: r.id,
              title: r.title || "Sans titre",
              doc_type: r.doc_type || "scan",
            }))
        );
      }
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  }, [links]);

  // Add a MyDrive link
  const addLink = (result: SearchResult) => {
    const newLink: NodeLink = {
      id: result.id,
      title: result.title,
      doc_type: result.doc_type,
    };
    const updatedLinks = [...links, newLink];
    data.links = updatedLinks;
    if (data.onLinksChange) {
      data.onLinksChange(updatedLinks);
    }
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  // Add a URL link
  const addUrlLink = (url: string) => {
    const trimmed = url.trim();
    // Extract a readable title from the URL
    let title: string;
    try {
      const parsed = new URL(trimmed);
      title = parsed.hostname.replace("www.", "");
    } catch {
      title = trimmed;
    }
    const newLink: NodeLink = {
      id: `url-${Date.now()}`,
      title,
      doc_type: "url",
      url: trimmed,
    };
    const updatedLinks = [...links, newLink];
    data.links = updatedLinks;
    if (data.onLinksChange) {
      data.onLinksChange(updatedLinks);
    }
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  // Handle Enter in search input
  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Enter" && searchQuery.trim()) {
      if (isUrl(searchQuery)) {
        addUrlLink(searchQuery);
      } else if (searchResults.length > 0) {
        addLink(searchResults[0]);
      }
    }
    if (e.key === "Escape") {
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // Remove a link
  const removeLink = (linkId: string) => {
    const updatedLinks = links.filter((l) => l.id !== linkId);
    data.links = updatedLinks;
    if (data.onLinksChange) {
      data.onLinksChange(updatedLinks);
    }
  };

  // Open link in new tab
  const openLink = (link: NodeLink) => {
    const href = getLinkHref(link);
    if (href) {
      window.open(href, "_blank");
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Bubble */}
      <div
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className={`
          px-4 py-2 rounded-lg border shadow-lg relative
          min-w-[150px] h-[50px] flex items-center justify-center transition-all duration-200
          ${
            selected
              ? "bg-neutral-800 border-blue-500 ring-2 ring-blue-500/50 text-white"
              : "bg-neutral-900 border-neutral-700 text-neutral-200 hover:border-neutral-500"
          }
        `}
      >
        {/* Handle gauche */}
        {!data.isRoot && (
          <Handle
            type="target"
            position={Position.Left}
            className="!w-3 !h-3 !bg-blue-500 !border-none"
          />
        )}

        {/* Contenu */}
        {isEditing ? (
          <input
            ref={inputRef}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={(e) => {
              e.stopPropagation();
              onKeyDown(e);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full text-center text-sm outline-none bg-transparent text-white font-medium"
          />
        ) : (
          <span className="text-sm font-medium pointer-events-none select-none">
            {label}
          </span>
        )}

        {/* Handle droite */}
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-blue-500 !border-none"
        />
      </div>

      {/* Links display + New Link button */}
      <div className="mt-1 flex flex-col items-end w-full min-w-[150px]">
        {/* Existing links */}
        {links.length > 0 && (
          <div className="flex flex-col gap-0.5 w-full mb-1">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-1 group/link"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openLink(link);
                  }}
                  className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline truncate max-w-[100px] text-left cursor-pointer transition-colors"
                  title={link.title}
                >
                  {link.title.length > 10
                    ? link.title.slice(0, 10) + "..."
                    : link.title}
                </button>
                <span className="text-[9px] text-neutral-500 shrink-0">
                  {DOC_TYPE_LABELS[link.doc_type] || link.doc_type}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLink(link.id);
                  }}
                  className="text-[9px] text-neutral-600 hover:text-red-400 opacity-0 group-hover/link:opacity-100 transition-opacity"
                  title="Supprimer le lien"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New Link button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSearch(!showSearch);
          }}
          className="text-[10px] text-neutral-500 hover:text-blue-400 transition-colors self-end cursor-pointer"
        >
          + Nouveau Lien
        </button>

        {/* Search dropdown */}
        {showSearch && (
          <div
            ref={searchContainerRef}
            className="mt-1 w-[220px] bg-neutral-800 border border-neutral-600 rounded-md shadow-xl z-50 self-end"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Rechercher ou coller une URL..."
              className="w-full px-2 py-1.5 text-xs bg-transparent text-white outline-none border-b border-neutral-700 placeholder-neutral-500"
            />
            {/* URL hint */}
            {isUrl(searchQuery) && (
              <div className="px-2 py-1.5 text-[10px] text-green-400">
                Appuyez Entrée pour ajouter cette URL
              </div>
            )}
            {isSearching && (
              <div className="px-2 py-1 text-[10px] text-neutral-500">
                Recherche...
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="max-h-[150px] overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      addLink(result);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="text-[9px] text-neutral-500 uppercase shrink-0">
                      {DOC_TYPE_LABELS[result.doc_type] || result.doc_type}
                    </span>
                    <span className="truncate">{result.title}</span>
                  </button>
                ))}
              </div>
            )}
            {searchQuery.length >= 3 && !isUrl(searchQuery) && !isSearching && searchResults.length === 0 && (
              <div className="px-2 py-1.5 text-[10px] text-neutral-500">
                Aucun résultat
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
