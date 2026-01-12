
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { LinkItem, Category, WebDavConfig, AIConfig, SearchMode, ExternalSearchSource, SearchConfig } from './types';
import { parseBookmarks } from './services/bookmarkParser';
import LinkModal from './components/LinkModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import BackupModal from './components/BackupModal';
import ImportModal from './components/ImportModal';
import SettingsModal from './components/SettingsModal';
import SearchConfigModal from './components/SearchConfigModal';
import ContextMenu from './components/ContextMenu';
import QRCodeModal from './components/QRCodeModal';
import Sidebar from './components/Sidebar';
import MainHeader from './components/MainHeader';
import LinkSections from './components/LinkSections';
import { useDataStore } from './hooks/useDataStore';

// --- 配置项 ---
// 项目核心仓库地址
const GITHUB_REPO_URL = 'https://github.com/aabacada/CloudNav-abcd';

const LOCAL_STORAGE_KEY = 'cloudnav_data_cache';
const WEBDAV_CONFIG_KEY = 'cloudnav_webdav_config';
const AI_CONFIG_KEY = 'cloudnav_ai_config';
const SEARCH_CONFIG_KEY = 'cloudnav_search_config';
const FAVICON_CACHE_KEY = 'cloudnav_favicon_cache';

type ThemeMode = 'light' | 'dark' | 'system';

function App() {
  // --- State ---
  const { links, categories, setLinks, setCategories, updateData, addLink, updateLink, deleteLink, togglePin: togglePinStore, reorderLinks, reorderPinnedLinks, deleteCategory: deleteCategoryStore, importData } = useDataStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarWidthClass = isSidebarCollapsed ? 'w-64 lg:w-20' : 'w-64 lg:w-64';

  // Search Mode State
  const [searchMode, setSearchMode] = useState<SearchMode>('external');
  const [externalSearchSources, setExternalSearchSources] = useState<ExternalSearchSource[]>([]);

  // WebDAV Config State
  const [webDavConfig, setWebDavConfig] = useState<WebDavConfig>({
    url: '',
    username: '',
    password: '',
    enabled: false
  });

  // AI Config State
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem(AI_CONFIG_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return {
      provider: 'gemini',
      apiKey: process.env.API_KEY || '',
      baseUrl: '',
      model: 'gemini-2.5-flash'
    };
  });

  // Site Settings State
  const [siteSettings, setSiteSettings] = useState(() => {
    const saved = localStorage.getItem('cloudnav_site_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return {
      title: 'CloudNav - 我的导航',
      navTitle: 'CloudNav',
      favicon: '',
      cardStyle: 'detailed' as const
    };
  });

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSearchConfigModalOpen, setIsSearchConfigModalOpen] = useState(false);

  const [editingLink, setEditingLink] = useState<LinkItem | undefined>(undefined);
  // State for data pre-filled from Bookmarklet
  const [prefillLink, setPrefillLink] = useState<Partial<LinkItem> | undefined>(undefined);

  const navTitleText = siteSettings.navTitle || 'CloudNav';
  const navTitleShort = navTitleText.slice(0, 2);

  // Sort State
  const [isSortingMode, setIsSortingMode] = useState<string | null>(null); // 存储正在排序的分类ID，null表示不在排序模式
  const [isSortingPinned, setIsSortingPinned] = useState(false); // 是否正在排序置顶链接

  // Batch Edit State
  const [isBatchEditMode, setIsBatchEditMode] = useState(false); // 是否处于批量编辑模式
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set()); // 选中的链接ID集合

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    link: LinkItem | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    link: null
  });

  // QR Code Modal State
  const [qrCodeModal, setQrCodeModal] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: '',
    title: ''
  });

  // Mobile Search State
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // --- Helpers & Sync Logic ---



  // --- Context Menu Functions ---
  const handleContextMenu = (event: React.MouseEvent, link: LinkItem) => {
    event.preventDefault();
    event.stopPropagation();

    // 在批量编辑模式下禁用右键菜单
    if (isBatchEditMode) return;

    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      link: link
    });
  };

  const closeContextMenu = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      link: null
    });
  };

  const copyLinkToClipboard = () => {
    if (!contextMenu.link) return;

    navigator.clipboard.writeText(contextMenu.link.url)
      .then(() => {
        // 可以添加一个短暂的提示
        console.log('链接已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制链接失败:', err);
      });

    closeContextMenu();
  };

  const showQRCode = () => {
    if (!contextMenu.link) return;

    setQrCodeModal({
      isOpen: true,
      url: contextMenu.link.url,
      title: contextMenu.link.title
    });

    closeContextMenu();
  };

  const editLinkFromContextMenu = () => {
    if (!contextMenu.link) return;

    setEditingLink(contextMenu.link);
    setIsModalOpen(true);
    closeContextMenu();
  };

  const deleteLinkFromContextMenu = () => {
    if (!contextMenu.link) return;

    if (window.confirm(`确定要删除"${contextMenu.link.title}"吗？`)) {
      const newLinks = links.filter(link => link.id !== contextMenu.link!.id);
      updateData(newLinks, categories);
    }

    closeContextMenu();
  };

  const togglePinFromContextMenu = () => {
    if (!contextMenu.link) return;

    const linkToToggle = links.find(l => l.id === contextMenu.link!.id);
    if (!linkToToggle) return;

    // 如果是设置为置顶，则设置pinnedOrder为当前置顶链接数量
    // 如果是取消置顶，则清除pinnedOrder
    const updated = links.map(l => {
      if (l.id === contextMenu.link!.id) {
        const isPinned = !l.pinned;
        return {
          ...l,
          pinned: isPinned,
          pinnedOrder: isPinned ? links.filter(link => link.pinned).length : undefined
        };
      }
      return l;
    });

    updateData(updated, categories);
    closeContextMenu();
  };



  const buildDefaultSearchSources = (): ExternalSearchSource[] => {
    const now = Date.now();
    return [
      {
        id: 'bing',
        name: '必应',
        url: 'https://www.bing.com/search?q={query}',
        icon: 'Search',
        enabled: true,
        createdAt: now
      },
      {
        id: 'google',
        name: 'Google',
        url: 'https://www.google.com/search?q={query}',
        icon: 'Search',
        enabled: true,
        createdAt: now
      },
      {
        id: 'baidu',
        name: '百度',
        url: 'https://www.baidu.com/s?wd={query}',
        icon: 'Globe',
        enabled: true,
        createdAt: now
      },
      {
        id: 'sogou',
        name: '搜狗',
        url: 'https://www.sogou.com/web?query={query}',
        icon: 'Globe',
        enabled: true,
        createdAt: now
      },
      {
        id: 'yandex',
        name: 'Yandex',
        url: 'https://yandex.com/search/?text={query}',
        icon: 'Globe',
        enabled: true,
        createdAt: now
      },
      {
        id: 'github',
        name: 'GitHub',
        url: 'https://github.com/search?q={query}',
        icon: 'Github',
        enabled: true,
        createdAt: now
      },
      {
        id: 'linuxdo',
        name: 'Linux.do',
        url: 'https://linux.do/search?q={query}',
        icon: 'Terminal',
        enabled: true,
        createdAt: now
      },
      {
        id: 'bilibili',
        name: 'B站',
        url: 'https://search.bilibili.com/all?keyword={query}',
        icon: 'Play',
        enabled: true,
        createdAt: now
      },
      {
        id: 'youtube',
        name: 'YouTube',
        url: 'https://www.youtube.com/results?search_query={query}',
        icon: 'Video',
        enabled: true,
        createdAt: now
      },
      {
        id: 'wikipedia',
        name: '维基',
        url: 'https://zh.wikipedia.org/wiki/Special:Search?search={query}',
        icon: 'BookOpen',
        enabled: true,
        createdAt: now
      }
    ];
  };

  const applyThemeMode = (mode: ThemeMode) => {
    if (typeof window === 'undefined') return;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = mode === 'dark' || (mode === 'system' && prefersDark);
    setDarkMode(shouldUseDark);
    if (shouldUseDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setThemeAndApply = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('theme', mode);
    applyThemeMode(mode);
  };

  // --- Effects ---

  useEffect(() => {
    // Theme init
    const storedTheme = localStorage.getItem('theme');
    const initialMode: ThemeMode = storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system'
      ? storedTheme
      : 'dark';
    setThemeMode(initialMode);
    applyThemeMode(initialMode);

    // Load WebDAV Config
    const savedWebDav = localStorage.getItem(WEBDAV_CONFIG_KEY);
    if (savedWebDav) {
      try {
        setWebDavConfig(JSON.parse(savedWebDav));
      } catch (e) { }
    }

    // Load Search Config
    const savedSearchConfig = localStorage.getItem(SEARCH_CONFIG_KEY);
    if (savedSearchConfig) {
      try {
        const parsed = JSON.parse(savedSearchConfig) as SearchConfig;
        if (parsed?.mode) {
          setSearchMode(parsed.mode);
          setExternalSearchSources(parsed.externalSources || []);
          if (parsed.selectedSource) {
            setSelectedSearchSource(parsed.selectedSource);
          }
        }
      } catch (e) { }
    } else {
      const defaultSources = buildDefaultSearchSources();
      setSearchMode('external');
      setExternalSearchSources(defaultSources);
      setSelectedSearchSource(defaultSources[0] || null);
    }

    // Handle URL Params for Bookmarklet (Add Link)
    const urlParams = new URLSearchParams(window.location.search);
    const addUrl = urlParams.get('add_url');
    if (addUrl) {
      const addTitle = urlParams.get('add_title') || '';
      // Clean URL params to avoid re-triggering on refresh
      window.history.replaceState({}, '', window.location.pathname);

      setPrefillLink({
        title: addTitle,
        url: addUrl,
        categoryId: 'common' // Default, Modal will handle selection
      });
      setEditingLink(undefined);
      setIsModalOpen(true);
    }


  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') {
        applyThemeMode('system');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [themeMode]);

  // Update page title and favicon when site settings change
  useEffect(() => {
    if (siteSettings.title) {
      document.title = siteSettings.title;
    }

    if (siteSettings.favicon) {
      // Remove existing favicon links
      const existingFavicons = document.querySelectorAll('link[rel="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());

      // Add new favicon
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.href = siteSettings.favicon;
      document.head.appendChild(favicon);
    }
  }, [siteSettings.title, siteSettings.favicon]);

  const toggleTheme = () => {
    const nextMode: ThemeMode = themeMode === 'light'
      ? 'dark'
      : themeMode === 'dark'
        ? 'system'
        : 'light';
    setThemeAndApply(nextMode);
  };

  // 视图模式切换处理函数
  const handleViewModeChange = (cardStyle: 'detailed' | 'simple') => {
    const newSiteSettings = { ...siteSettings, cardStyle };
    setSiteSettings(newSiteSettings);
    localStorage.setItem('cloudnav_site_settings', JSON.stringify(newSiteSettings));
  };

  // --- Batch Edit Functions ---
  const toggleBatchEditMode = () => {
    setIsBatchEditMode(!isBatchEditMode);
    setSelectedLinks(new Set()); // 退出批量编辑模式时清空选中项
  };

  const toggleLinkSelection = (linkId: string) => {
    setSelectedLinks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(linkId)) {
        newSet.delete(linkId);
      } else {
        newSet.add(linkId);
      }
      return newSet;
    });
  };

  const handleBatchDelete = () => {
    if (selectedLinks.size === 0) {
      alert('请先选择要删除的链接');
      return;
    }

    if (confirm(`确定要删除选中的 ${selectedLinks.size} 个链接吗？`)) {
      const newLinks = links.filter(link => !selectedLinks.has(link.id));
      updateData(newLinks, categories);
      setSelectedLinks(new Set());
      setIsBatchEditMode(false);
    }
  };

  const handleBatchMove = (targetCategoryId: string) => {
    if (selectedLinks.size === 0) {
      alert('请先选择要移动的链接');
      return;
    }

    const newLinks = links.map(link =>
      selectedLinks.has(link.id) ? { ...link, categoryId: targetCategoryId } : link
    );
    updateData(newLinks, categories);
    setSelectedLinks(new Set());
    setIsBatchEditMode(false);
  };

  const handleSelectAll = () => {
    // 获取当前显示的所有链接ID
    const currentLinkIds = displayedLinks.map(link => link.id);

    // 如果已选中的链接数量等于当前显示的链接数量，则取消全选
    if (selectedLinks.size === currentLinkIds.length && currentLinkIds.every(id => selectedLinks.has(id))) {
      setSelectedLinks(new Set());
    } else {
      // 否则全选当前显示的所有链接
      setSelectedLinks(new Set(currentLinkIds));
    }
  };

  // --- Actions ---
  const handleImportConfirm = (newLinks: LinkItem[], newCategories: Category[]) => {
    importData(newLinks, newCategories);
    setIsImportModalOpen(false);
    alert(`成功导入 ${newLinks.length} 个新书签!`);
  };

  const handleAddLink = (data: Omit<LinkItem, 'id' | 'createdAt'>) => {
    addLink(data);
    setPrefillLink(undefined);
  };

  const handleEditLink = (data: Omit<LinkItem, 'id' | 'createdAt'>) => {
    if (!editingLink) return;
    updateLink({ ...data, id: editingLink.id });
    setEditingLink(undefined);
  };

  // 拖拽结束事件处理函数
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderLinks(active.id as string, over.id as string, selectedCategory);
    }
  };

  // 置顶链接拖拽结束事件处理函数
  const handlePinnedDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderPinnedLinks(active.id as string, over.id as string);
    }
  };

  // 开始排序
  const startSorting = (categoryId: string) => {
    setIsSortingMode(categoryId);
  };

  // 保存排序
  const saveSorting = () => {
    // 在保存排序时，确保将当前排序后的数据保存到服务器和本地存储
    updateData(links, categories);
    setIsSortingMode(null);
  };

  // 取消排序
  const cancelSorting = () => {
    setIsSortingMode(null);
  };

  // 保存置顶链接排序
  const savePinnedSorting = () => {
    // 在保存排序时，确保将当前排序后的数据保存到服务器和本地存储
    updateData(links, categories);
    setIsSortingPinned(false);
  };

  // 取消置顶链接排序
  const cancelPinnedSorting = () => {
    setIsSortingPinned(false);
  };

  // 设置dnd-kit的传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要拖动8px才开始拖拽，避免误触
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDeleteLink = (id: string) => {
    if (confirm('确定删除此链接吗?')) {
      deleteLink(id);
    }
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePinStore(id);
  };

  const handleSaveAIConfig = async (config: AIConfig, newSiteSettings?: any) => {
    setAiConfig(config);
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));

    if (newSiteSettings) {
      setSiteSettings(newSiteSettings);
      localStorage.setItem('cloudnav_site_settings', JSON.stringify(newSiteSettings));
    }
  };

  const handleRestoreAIConfig = async (config: AIConfig) => {
    setAiConfig(config);
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
  };

  // --- Category Management ---

  const handleCategoryClick = (cat: Category) => {
    setSelectedCategory(cat.id);
    setSidebarOpen(false);
  };

  const handleUpdateCategories = (newCats: Category[]) => {
    updateData(links, newCats);
  };

  const handleDeleteCategory = (catId: string) => {
    deleteCategoryStore(catId);
  };

  // --- WebDAV Config ---
  const handleSaveWebDavConfig = (config: WebDavConfig) => {
    setWebDavConfig(config);
    localStorage.setItem(WEBDAV_CONFIG_KEY, JSON.stringify(config));
  };

  // 搜索源选择弹出窗口状态
  const [showSearchSourcePopup, setShowSearchSourcePopup] = useState(false);
  const [hoveredSearchSource, setHoveredSearchSource] = useState<ExternalSearchSource | null>(null);
  const [selectedSearchSource, setSelectedSearchSource] = useState<ExternalSearchSource | null>(null);
  const [isIconHovered, setIsIconHovered] = useState(false);
  const [isPopupHovered, setIsPopupHovered] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 处理弹出窗口显示/隐藏逻辑
  useEffect(() => {
    if (isIconHovered || isPopupHovered) {
      // 如果图标或弹出窗口被悬停，清除隐藏定时器并显示弹出窗口
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setShowSearchSourcePopup(true);
    } else {
      // 如果图标和弹出窗口都没有被悬停，设置一个延迟隐藏弹出窗口
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = setTimeout(() => {
        setShowSearchSourcePopup(false);
        setHoveredSearchSource(null);
      }, 100);
    }

    // 清理函数
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isIconHovered, isPopupHovered]);

  // 处理搜索源选择
  const handleSearchSourceSelect = async (source: ExternalSearchSource) => {
    // 更新选中的搜索源
    setSelectedSearchSource(source);

    // 保存选中的搜索源到本地
    await handleSaveSearchConfig(externalSearchSources, searchMode, source);

    if (searchQuery.trim()) {
      const searchUrl = source.url.replace('{query}', encodeURIComponent(searchQuery));
      window.open(searchUrl, '_blank');
    }
    setShowSearchSourcePopup(false);
    setHoveredSearchSource(null);
  };

  // --- Search Config ---
  const handleSaveSearchConfig = async (sources: ExternalSearchSource[], mode: SearchMode, selectedSource?: ExternalSearchSource | null) => {
    const searchConfig: SearchConfig = {
      mode,
      externalSources: sources,
      selectedSource: selectedSource !== undefined ? selectedSource : selectedSearchSource
    };

    setExternalSearchSources(sources);
    setSearchMode(mode);
    if (selectedSource !== undefined) {
      setSelectedSearchSource(selectedSource);
    }
    localStorage.setItem(SEARCH_CONFIG_KEY, JSON.stringify(searchConfig));
  };

  const handleSearchModeChange = (mode: SearchMode) => {
    setSearchMode(mode);

    // 如果切换到外部搜索模式且搜索源列表为空，自动加载默认搜索源
    if (mode === 'external' && externalSearchSources.length === 0) {
      const defaultSources = buildDefaultSearchSources();
      handleSaveSearchConfig(defaultSources, mode, defaultSources[0]);
    } else {
      handleSaveSearchConfig(externalSearchSources, mode);
    }
  };

  const handleExternalSearch = () => {
    if (searchQuery.trim() && searchMode === 'external') {
      // 如果搜索源列表为空，自动加载默认搜索源
      if (externalSearchSources.length === 0) {
        const defaultSources = buildDefaultSearchSources();
        handleSaveSearchConfig(defaultSources, 'external', defaultSources[0]);

        // 使用第一个默认搜索源立即执行搜索
        const searchUrl = defaultSources[0].url.replace('{query}', encodeURIComponent(searchQuery));
        window.open(searchUrl, '_blank');
        return;
      }

      // 如果有选中的搜索源，使用选中的搜索源；否则使用第一个启用的搜索源
      let source = selectedSearchSource;
      if (!source) {
        const enabledSources = externalSearchSources.filter(s => s.enabled);
        if (enabledSources.length > 0) {
          source = enabledSources[0];
        }
      }

      if (source) {
        const searchUrl = source.url.replace('{query}', encodeURIComponent(searchQuery));
        window.open(searchUrl, '_blank');
      }
    }
  };

  const handleRestoreBackup = (restoredLinks: LinkItem[], restoredCategories: Category[]) => {
    updateData(restoredLinks, restoredCategories);
    setIsBackupModalOpen(false);
  };

  const handleRestoreSearchConfig = (restoredSearchConfig: SearchConfig) => {
    handleSaveSearchConfig(restoredSearchConfig.externalSources, restoredSearchConfig.mode);
  };

  // --- Filtering & Memo ---

  const pinnedLinks = useMemo(() => {
    const filteredPinnedLinks = links.filter(l => l.pinned);
    return filteredPinnedLinks.sort((a, b) => {
      // 如果有pinnedOrder字段，则使用pinnedOrder排序
      if (a.pinnedOrder !== undefined && b.pinnedOrder !== undefined) {
        return a.pinnedOrder - b.pinnedOrder;
      }
      // 如果只有一个有pinnedOrder字段，有pinnedOrder的排在前面
      if (a.pinnedOrder !== undefined) return -1;
      if (b.pinnedOrder !== undefined) return 1;
      // 如果都没有pinnedOrder字段，则按创建时间排序
      return a.createdAt - b.createdAt;
    });
  }, [links]);

  const displayedLinks = useMemo(() => {
    let result = links;

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q))
      );
    }

    // Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter(l => l.categoryId === selectedCategory);
    }

    // 按照order字段排序，如果没有order字段则按创建时间排序
    // 修改排序逻辑：order值越大排在越前面，新增的卡片order值最大，会排在最前面
    // 我们需要反转这个排序，让新增的卡片(order值最大)排在最后面
    return result.sort((a, b) => {
      const aOrder = a.order !== undefined ? a.order : a.createdAt;
      const bOrder = b.order !== undefined ? b.order : b.createdAt;
      // 改为升序排序，这样order值小(旧卡片)的排在前面，order值大(新卡片)的排在后面
      return aOrder - bOrder;
    });
  }, [links, selectedCategory, searchQuery]);

  const canSortPinned = selectedCategory === 'all' && !searchQuery && pinnedLinks.length > 1;
  const canSortCategory = selectedCategory !== 'all' && displayedLinks.length > 1;
  const isSortingCategory = selectedCategory !== 'all' && isSortingMode === selectedCategory;


  // --- Render Components ---





  return (
    <div className="flex h-screen overflow-hidden text-slate-900 dark:text-slate-50">
      <CategoryManagerModal
        isOpen={isCatManagerOpen}
        onClose={() => setIsCatManagerOpen(false)}
        categories={categories}
        onUpdateCategories={handleUpdateCategories}
        onDeleteCategory={handleDeleteCategory}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        links={links}
        categories={categories}
        onRestore={handleRestoreBackup}
        webDavConfig={webDavConfig}
        onSaveWebDavConfig={handleSaveWebDavConfig}
        searchConfig={{ mode: searchMode, externalSources: externalSearchSources }}
        onRestoreSearchConfig={handleRestoreSearchConfig}
        aiConfig={aiConfig}
        onRestoreAIConfig={handleRestoreAIConfig}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingLinks={links}
        categories={categories}
        onImport={handleImportConfirm}
        onImportSearchConfig={handleRestoreSearchConfig}
        onImportAIConfig={handleRestoreAIConfig}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={aiConfig}
        siteSettings={siteSettings}
        onSave={handleSaveAIConfig}
        links={links}
        onUpdateLinks={(newLinks) => updateData(newLinks, categories)}
      />

      <SearchConfigModal
        isOpen={isSearchConfigModalOpen}
        onClose={() => setIsSearchConfigModalOpen(false)}
        sources={externalSearchSources}
        onSave={(sources) => handleSaveSearchConfig(sources, searchMode)}
      />
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        sidebarOpen={sidebarOpen}
        sidebarWidthClass={sidebarWidthClass}
        isSidebarCollapsed={isSidebarCollapsed}
        navTitleText={navTitleText}
        navTitleShort={navTitleShort}
        selectedCategory={selectedCategory}
        categories={categories}
        repoUrl={GITHUB_REPO_URL}
        onSelectAll={() => {
          setSelectedCategory('all');
          setSidebarOpen(false);
        }}
        onSelectCategory={(cat) => {
          handleCategoryClick(cat);
          setSidebarOpen(false);
        }}
        onToggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenCategoryManager={() => setIsCatManagerOpen(true)}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50 dark:bg-slate-950">
        <div className="absolute inset-0 pointer-events-none">
          {/* Light Mode Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 dark:hidden"></div>

          {/* Dark Mode Aurora Background */}
          <div className="absolute inset-0 hidden dark:block bg-[#0f172a]" style={{
            backgroundImage: `
              radial-gradient(circle at 15% 50%, rgba(79, 70, 229, 0.15), transparent 25%), 
              radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.15), transparent 25%)
            `,
            backgroundAttachment: 'fixed'
          }}></div>
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <MainHeader
            navTitleText={navTitleText}
            siteCardStyle={siteSettings.cardStyle}
            themeMode={themeMode}
            darkMode={darkMode}
            isMobileSearchOpen={isMobileSearchOpen}
            searchMode={searchMode}
            searchQuery={searchQuery}
            externalSearchSources={externalSearchSources}
            hoveredSearchSource={hoveredSearchSource}
            selectedSearchSource={selectedSearchSource}
            showSearchSourcePopup={showSearchSourcePopup}
            canSortPinned={canSortPinned}
            canSortCategory={canSortCategory}
            isSortingPinned={isSortingPinned}
            isSortingCategory={isSortingCategory}
            onOpenSidebar={() => setSidebarOpen(true)}
            onToggleTheme={toggleTheme}
            onViewModeChange={handleViewModeChange}
            onSearchModeChange={handleSearchModeChange}
            onOpenSearchConfig={() => setIsSearchConfigModalOpen(true)}
            onSearchQueryChange={setSearchQuery}
            onExternalSearch={handleExternalSearch}
            onSearchSourceSelect={handleSearchSourceSelect}
            onHoverSearchSource={setHoveredSearchSource}
            onIconHoverChange={setIsIconHovered}
            onPopupHoverChange={setIsPopupHovered}
            onToggleMobileSearch={() => {
              setIsMobileSearchOpen(!isMobileSearchOpen);
              if (searchMode !== 'external') {
                handleSearchModeChange('external');
              }
            }}
            onToggleSearchSourcePopup={() => setShowSearchSourcePopup((prev) => !prev)}
            onStartPinnedSorting={() => setIsSortingPinned(true)}
            onStartCategorySorting={() => startSorting(selectedCategory)}
            onSavePinnedSorting={savePinnedSorting}
            onCancelPinnedSorting={cancelPinnedSorting}
            onSaveCategorySorting={saveSorting}
            onCancelCategorySorting={cancelSorting}
            onAddLink={() => { setEditingLink(undefined); setPrefillLink(undefined); setIsModalOpen(true); }}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />

          <LinkSections
            linksCount={links.length}
            pinnedLinks={pinnedLinks}
            displayedLinks={displayedLinks}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            categories={categories}
            siteCardStyle={siteSettings.cardStyle}
            isSortingPinned={isSortingPinned}
            isSortingMode={isSortingMode}
            isBatchEditMode={isBatchEditMode}
            selectedLinksCount={selectedLinks.size}
            sensors={sensors}
            onPinnedDragEnd={handlePinnedDragEnd}
            onDragEnd={handleDragEnd}
            onToggleBatchEditMode={toggleBatchEditMode}
            onBatchDelete={handleBatchDelete}
            onSelectAll={handleSelectAll}
            onBatchMove={handleBatchMove}
            onAddLink={() => { setEditingLink(undefined); setPrefillLink(undefined); setIsModalOpen(true); }}
            selectedLinks={selectedLinks}
            onLinkSelect={toggleLinkSelection}
            onLinkContextMenu={handleContextMenu}
            onLinkEdit={(link) => { setEditingLink(link); setIsModalOpen(true); }}
          />
        </div>
      </main>

      <LinkModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingLink(undefined); setPrefillLink(undefined); }}
        onSave={editingLink ? handleEditLink : handleAddLink}
        onDelete={editingLink ? handleDeleteLink : undefined}
        categories={categories}
        initialData={editingLink || (prefillLink as LinkItem)}
        aiConfig={aiConfig}
        defaultCategoryId={selectedCategory !== 'all' ? selectedCategory : undefined}
      />

      {/* 右键菜单 */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onCopyLink={copyLinkToClipboard}
        onShowQRCode={showQRCode}
        onEditLink={editLinkFromContextMenu}
        onDeleteLink={deleteLinkFromContextMenu}
        onTogglePin={togglePinFromContextMenu}
      />

      {/* 二维码模态框 */}
      <QRCodeModal
        isOpen={qrCodeModal.isOpen}
        url={qrCodeModal.url || ''}
        title={qrCodeModal.title || ''}
        onClose={() => setQrCodeModal({ isOpen: false, url: '', title: '' })}
      />
    </div>
  );
}

export default App;

