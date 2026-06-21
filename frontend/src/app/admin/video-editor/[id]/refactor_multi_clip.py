import re
import os

filepath = r"d:\AI projects Cursor\Landing Page Builder\frontend\src\app\admin\video-editor\[id]\page.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State definition
content = content.replace(
    "const [selectedClipId, setSelectedClipId] = useState<string | null>(null);",
    "const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);"
)

# 2. primary selected clip derivation
content = content.replace(
    "const selectedClip = clips.find(c => c.id === selectedClipId) || null;",
    "const primarySelectedClipId = selectedClipIds[0] || null;\n  const selectedClip = clips.find(c => c.id === primarySelectedClipId) || null;"
)

# 3. updateSelectedClip
old_update_fn = """  const updateSelectedClip = useCallback((updates: Partial<VideoClip>) => {
    if (!selectedClipId) return;
    setClips(prev => prev.map(c => {
      if (c.id === selectedClipId) {
        const merged = { ...c, ...updates };
        if (updates.trimStart !== undefined || updates.trimEnd !== undefined || updates.playbackRate !== undefined) {
           const tStart = merged.trimStart || 0;
           const tEnd = merged.trimEnd || merged.fileDuration;
           const pRate = merged.playbackRate || 1;
           merged.duration = (tEnd - tStart) / pRate;
        }
        return merged;
      }
      return c;
    }));
  }, [selectedClipId, setClips]);"""

new_update_fn = """  const updateSelectedClip = useCallback((updates: Partial<VideoClip>) => {
    if (selectedClipIds.length === 0) return;
    setClips(prev => prev.map(c => {
      if (selectedClipIds.includes(c.id)) {
        const merged = { ...c, ...updates };
        if (updates.trimStart !== undefined || updates.trimEnd !== undefined || updates.playbackRate !== undefined) {
           const tStart = merged.trimStart || 0;
           const tEnd = merged.trimEnd || merged.fileDuration;
           const pRate = merged.playbackRate || 1;
           merged.duration = (tEnd - tStart) / pRate;
        }
        return merged;
      }
      return c;
    }));
  }, [selectedClipIds, setClips]);"""
content = content.replace(old_update_fn, new_update_fn)

# 4. deleteClip (Lines 2095 - 2115 approx)
old_delete_clip = """  const deleteClip = (id: string) => {
    const deletedClip = clips.find(c => c.id === id);
    setClips(prev => {
      if (!deletedClip) return prev;
      
      const filtered = prev.filter(c => c.id !== id);
      
      if (isRippleEnabledRef.current) {
         return filtered.map(c => {
           if (c.trackId === deletedClip.trackId && c.startTime >= deletedClip.startTime) {
             return { ...c, startTime: Math.max(0, c.startTime - deletedClip.duration) };
           }
           return c;
         });
      }
      return filtered;
    });
    if (selectedClipId === id) setSelectedClipId(null);
  };"""

new_delete_clip = """  const deleteClip = (id: string) => {
    const deletedClip = clips.find(c => c.id === id);
    setClips(prev => {
      if (!deletedClip) return prev;
      
      const filtered = prev.filter(c => c.id !== id);
      
      if (isRippleEnabledRef.current) {
         return filtered.map(c => {
           if (c.trackId === deletedClip.trackId && c.startTime >= deletedClip.startTime) {
             return { ...c, startTime: Math.max(0, c.startTime - deletedClip.duration) };
           }
           return c;
         });
      }
      return filtered;
    });
    if (selectedClipIds.includes(id)) {
        setSelectedClipIds(prev => prev.filter(vid => vid !== id));
    }
  };"""
content = content.replace(old_delete_clip, new_delete_clip)

# 5. Timeline main clip onMouseDown
old_mousedown_timeline = """                           onMouseDown={(e) => {
                             e.stopPropagation();
                             setSelectedClipId(clip.id);
                             setSelectedAssetId(null);"""

new_mousedown_timeline = """                           onMouseDown={(e) => {
                             e.stopPropagation();
                             if (e.shiftKey || e.ctrlKey || e.metaKey) {
                                setSelectedClipIds(prev => prev.includes(clip.id) ? prev.filter(id => id !== clip.id) : [...prev, clip.id]);
                             } else {
                                if (!selectedClipIds.includes(clip.id)) {
                                    setSelectedClipIds([clip.id]);
                                }
                             }
                             setSelectedAssetId(null);"""
content = content.replace(old_mousedown_timeline, new_mousedown_timeline)

# 6. Timeline left handle onMouseDown
old_mousedown_left = """                               onMouseDown={(e) => {
                                 e.stopPropagation();
                                 setSelectedClipId(clip.id);
                                 setSelectedAssetId(null);"""

new_mousedown_left = """                               onMouseDown={(e) => {
                                 e.stopPropagation();
                                 if (!selectedClipIds.includes(clip.id)) setSelectedClipIds([clip.id]);
                                 setSelectedAssetId(null);"""
content = content.replace(old_mousedown_left, new_mousedown_left)

# 8. Remaining setSelectedClipId(null)
content = re.sub(r'setSelectedClipId\(\s*null\s*\)', 'setSelectedClipIds([])', content)

# 9. Other setSelectedClipId(X)
content = re.sub(r'setSelectedClipId\(([^)]+)\)', r'setSelectedClipIds([\1])', content)

# 10. Remaining selectedClipId usages
content = content.replace('!selectedClipId', 'selectedClipIds.length === 0')
content = content.replace('selectedClipId', 'primarySelectedClipId')

# 11. Fix the dependency array in useEffects
content = content.replace('[primarySelectedClipId,', '[selectedClipIds,')
content = content.replace(' primarySelectedClipId,', ' selectedClipIds,')
content = content.replace(', primarySelectedClipId]', ', selectedClipIds]')
content = content.replace(', primarySelectedClipId,', ', selectedClipIds,')

# 13. isSelected logic
content = content.replace(
    "const isSelected = selectedClip?.id === clip.id;",
    "const isSelected = selectedClipIds.includes(clip.id);"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Refactoring complete.")
