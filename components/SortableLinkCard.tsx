import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LinkItem } from '../types';

interface SortableLinkCardProps {
    link: LinkItem;
    siteCardStyle: 'detailed' | 'simple';
    isSortingMode: boolean;
    isSortingPinned: boolean;
}

const SortableLinkCard: React.FC<SortableLinkCardProps> = ({
    link,
    siteCardStyle,
    isSortingMode,
    isSortingPinned
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: link.id });

    const isDetailedView = siteCardStyle === 'detailed';

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative transition-all duration-300 cursor-grab active:cursor-grabbing min-w-0 max-w-full overflow-hidden backdrop-blur-md ${isSortingMode || isSortingPinned
                    ? 'bg-emerald-500/10 border-emerald-400/50'
                    : 'bg-slate-800/40 border border-white/5'
                } ${isDragging ? 'shadow-2xl scale-[1.02]' : 'hover:-translate-y-1 hover:bg-slate-800/60 hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]'} ${isDetailedView
                    ? 'flex flex-col rounded-2xl p-4 min-h-[100px]'
                    : 'flex items-center rounded-xl p-3'
                }`}
            {...attributes}
            {...listeners}
        >
            {/* 链接内容 - 移除a标签，改为div防止点击跳转 */}
            <div className={`flex flex-1 min-w-0 overflow-hidden ${isDetailedView ? 'flex-col' : 'items-center gap-3'
                }`}>
                {/* 第一行：图标和标题水平排列 */}
                <div className={`flex items-center gap-3 mb-2 ${isDetailedView ? '' : 'w-full'
                    }`}>
                    {/* Icon */}
                    <div className={`text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold uppercase shrink-0 ${isDetailedView ? 'w-8 h-8 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800' : 'w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700'
                        }`}>
                        {link.icon ? <img src={link.icon} alt="" className="w-5 h-5" /> : link.title.charAt(0)}
                    </div>

                    {/* 标题 */}
                    <h3 className={`text-slate-900 dark:text-slate-100 truncate overflow-hidden text-ellipsis ${isDetailedView ? 'text-base' : 'text-sm font-medium text-slate-800 dark:text-slate-200'
                        }`} title={link.title}>
                        {link.title}
                    </h3>
                </div>

                {/* 第二行：描述文字 */}
                {isDetailedView && link.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {link.description}
                    </p>
                )}
            </div>
        </div>
    );
};

export default SortableLinkCard;
