import React from 'react';
import { DndContext, DragEndEvent, closestCorners, SensorDescriptor } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Pin, Trash2, CheckSquare, Upload, Search } from 'lucide-react';
import { Category, LinkItem } from '../types';
import Icon from './Icon';
import LinkCard from './LinkCard';
import SortableLinkCard from './SortableLinkCard';

interface LinkSectionsProps {
  linksCount: number;
  pinnedLinks: LinkItem[];
  displayedLinks: LinkItem[];
  selectedCategory: string;
  searchQuery: string;
  categories: Category[];
  siteCardStyle: 'detailed' | 'simple';
  isSortingPinned: boolean;
  isSortingMode: string | null;
  isBatchEditMode: boolean;
  selectedLinksCount: number;
  selectedLinks: Set<string>;
  sensors: SensorDescriptor<any>[];
  onPinnedDragEnd: (event: DragEndEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onToggleBatchEditMode: () => void;
  onBatchDelete: () => void;
  onSelectAll: () => void;
  onBatchMove: (targetCategoryId: string) => void;
  onAddLink: () => void;
  onLinkSelect: (id: string) => void;
  onLinkContextMenu: (e: React.MouseEvent, link: LinkItem) => void;
  onLinkEdit: (link: LinkItem) => void;
}

const LinkSections: React.FC<LinkSectionsProps> = ({
  linksCount,
  pinnedLinks,
  displayedLinks,
  selectedCategory,
  searchQuery,
  categories,
  siteCardStyle,
  isSortingPinned,
  isSortingMode,
  isBatchEditMode,
  selectedLinksCount,
  selectedLinks,
  sensors,
  onPinnedDragEnd,
  onDragEnd,
  onToggleBatchEditMode,
  onBatchDelete,
  onSelectAll,
  onBatchMove,
  onAddLink,
  onLinkSelect,
  onLinkContextMenu,
  onLinkEdit
}) => {
  const showPinnedSection = pinnedLinks.length > 0 && !searchQuery && (selectedCategory === 'all');
  const showMainSection = (selectedCategory !== 'all' || searchQuery);
  const gridClassName = siteCardStyle === 'detailed'
    ? 'grid-cols-[repeat(auto-fill,minmax(250px,1fr))]'
    : 'grid-cols-[repeat(auto-fill,minmax(180px,1fr))]';

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-10 pb-10 space-y-8">
      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-4">
        <span>{linksCount} 个站点</span>
        <span>{categories.length} 个分类</span>
        <span>{pinnedLinks.length} 置顶</span>
      </div>
      {!showPinnedSection && !showMainSection && (
        <div className="flex justify-center pt-6">
          <button
            onClick={onAddLink}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/10 hover:text-accent hover:border-accent/60 transition-colors"
          >
            <span className="text-base leading-none">+</span> 添加网址
          </button>
        </div>
      )}

      {showPinnedSection && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Pin size={16} className="text-blue-500 fill-blue-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                置顶 / 常用
              </h2>
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full">
                {pinnedLinks.length}
              </span>
            </div>
          </div>
          {isSortingPinned ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragEnd={onPinnedDragEnd}
            >
              <SortableContext
                items={pinnedLinks.map((link) => link.id)}
                strategy={rectSortingStrategy}
              >
                <div className={`grid gap-5 ${gridClassName}`}>
                  {pinnedLinks.map((link) => (
                    <SortableLinkCard
                      key={link.id}
                      link={link}
                      siteCardStyle={siteCardStyle}
                      isSortingMode={false}
                      isSortingPinned={isSortingPinned}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className={`grid gap-5 ${gridClassName}`}>
              {pinnedLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  siteCardStyle={siteCardStyle}
                  isBatchEditMode={isBatchEditMode}
                  isSelected={selectedLinks.has(link.id)}
                  onSelect={onLinkSelect}
                  onContextMenu={onLinkContextMenu}
                  onEdit={onLinkEdit}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {showMainSection && (
        <section>
          {(!pinnedLinks.length && !searchQuery && selectedCategory === 'all') && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">早安 👋</h1>
                <p className="text-sm opacity-90 mt-1">
                  {linksCount} 个链接 · {categories.length} 个分类
                </p>
              </div>
              <Icon name="Compass" size={48} className="opacity-20" />
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              {selectedCategory === 'all'
                ? (searchQuery ? '搜索结果' : '所有链接')
                : (
                  <>
                    {categories.find((c) => c.id === selectedCategory)?.name}
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full">
                      {displayedLinks.length}
                    </span>
                  </>
                )
              }
            </h2>
            {selectedCategory !== 'all' && !isSortingMode && (
              <div className="flex gap-2">
                <button
                  onClick={onToggleBatchEditMode}
                  className={`flex items-center gap-1 px-3 py-1.5 text-white text-xs font-medium rounded-full transition-colors ${isBatchEditMode
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  title={isBatchEditMode ? '退出批量编辑' : '批量编辑'}
                >
                  {isBatchEditMode ? '取消' : '批量编辑'}
                </button>
                {isBatchEditMode && (
                  <>
                    <button
                      onClick={onBatchDelete}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-full transition-colors"
                      title="批量删除"
                    >
                      <Trash2 size={14} />
                      <span>批量删除</span>
                    </button>
                    <button
                      onClick={onSelectAll}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-full transition-colors"
                      title="全选/取消全选"
                    >
                      <CheckSquare size={14} />
                      <span>{selectedLinksCount === displayedLinks.length ? '取消全选' : '全选'}</span>
                    </button>
                    <div className="relative group">
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-full transition-colors"
                        title="批量移动"
                      >
                        <Upload size={14} />
                        <span>批量移动</span>
                      </button>
                      <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        {categories.filter((cat) => cat.id !== selectedCategory).map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => onBatchMove(cat.id)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg"
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {displayedLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <Search size={40} className="opacity-30 mb-4" />
              <p>没有找到相关内容</p>
              {selectedCategory !== 'all' && (
                <button onClick={onAddLink} className="mt-4 text-accent hover:underline">添加一个?</button>
              )}
            </div>
          ) : (
            isSortingMode === selectedCategory ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={displayedLinks.map((link) => link.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className={`grid gap-5 ${gridClassName}`}>
                    {displayedLinks.map((link) => (
                      <SortableLinkCard
                        key={link.id}
                        link={link}
                        siteCardStyle={siteCardStyle}
                        isSortingMode={true}
                        isSortingPinned={false}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className={`grid gap-5 ${gridClassName}`}>
                {displayedLinks.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    siteCardStyle={siteCardStyle}
                    isBatchEditMode={isBatchEditMode}
                    isSelected={selectedLinks.has(link.id)}
                    onSelect={onLinkSelect}
                    onContextMenu={onLinkContextMenu}
                    onEdit={onLinkEdit}
                  />
                ))}
              </div>
            )
          )}
        </section>
      )}
    </div>
  );
};

export default LinkSections;
