import React from 'react';
import { LinkItem } from '../types';

interface LinkCardProps {
    link: LinkItem;
    siteCardStyle: 'detailed' | 'simple';
    isBatchEditMode: boolean;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onContextMenu: (e: React.MouseEvent, link: LinkItem) => void;
    onEdit: (link: LinkItem) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({
    link,
    siteCardStyle,
    isBatchEditMode,
    isSelected,
    onSelect,
    onContextMenu,
    onEdit
}) => {
    const isDetailedView = siteCardStyle === 'detailed';

    return (
        <div
            className={`group relative transition-all duration-300 backdrop-blur-md ${isBatchEditMode ? '' : 'hover:-translate-y-1 hover:bg-slate-800/60 hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]'} ${isSelected
                    ? 'bg-rose-500/10 border-rose-400/50'
                    : 'bg-slate-800/40 border border-white/5'
                } ${isBatchEditMode ? 'cursor-pointer' : ''} ${isDetailedView
                    ? 'flex flex-col rounded-2xl p-4 min-h-[100px]'
                    : 'flex items-center justify-between rounded-xl p-3'
                }`}
            onClick={() => isBatchEditMode && onSelect(link.id)}
            onContextMenu={(e) => onContextMenu(e, link)}
        >
            {/* 链接内容 - 在批量编辑模式下不使用a标签 */}
            {isBatchEditMode ? (
                <div className={`flex flex-1 min-w-0 overflow-hidden h-full ${isDetailedView ? 'flex-col' : 'items-center'
                    }`}>
                    {/* 第一行：图标和标题水平排列 */}
                    <div className={`flex items-center gap-3 w-full`}>
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
            ) : (
                <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-1 min-w-0 overflow-hidden h-full ${isDetailedView ? 'flex-col' : 'items-center'
                        }`}
                    title={isDetailedView ? link.url : (link.description || link.url)} // 详情版视图只显示URL作为tooltip
                >
                    {/* 第一行：图标和标题水平排列 */}
                    <div className={`flex items-center gap-3 w-full`}>
                        {/* Icon */}
                        <div className={`text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold uppercase shrink-0 ${isDetailedView ? 'w-8 h-8 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800' : 'w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700'
                            }`}>
                            {link.icon ? <img src={link.icon} alt="" className="w-5 h-5" /> : link.title.charAt(0)}
                        </div>

                        {/* 标题 */}
                        <h3 className={`text-slate-800 dark:text-slate-200 truncate whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${isDetailedView ? 'text-base' : 'text-sm font-medium'
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
                    {!isDetailedView && link.description && (
                        <div className="tooltip-custom absolute left-0 -top-8 w-max max-w-[200px] bg-black text-white text-xs p-2 rounded opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all z-20 pointer-events-none truncate">
                            {link.description}
                        </div>
                    )}
                </a>
            )}

            {/* Hover Actions (Absolute Right) - 在批量编辑模式下隐藏 */}
            {!isBatchEditMode && (
                <div className={`flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 dark:bg-blue-900/20 backdrop-blur-sm rounded-md p-1 absolute ${isDetailedView ? 'top-3 right-3' : 'top-1/2 -translate-y-1/2 right-2'
                    }`}>
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(link); }}
                        className="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                        title="编辑"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.65-.07-.97l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.08-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.32-.07.64-.07.97c0 .33.03.65.07.97l-2.11 1.63c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.08.49 0 .61-.22l2-3.46c.13-.22.07-.49-.12-.64l-2.11-1.63Z" fill="currentColor" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default LinkCard;
