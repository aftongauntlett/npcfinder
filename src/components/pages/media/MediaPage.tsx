import { useEffect, useMemo, useState } from "react";
import { Library } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { TabPanel } from "@/components/shared";
import type { Tab } from "@/components/shared";
import MediaCollectionsTab from "@/components/pages/media/MediaCollectionsTab";
import MediaCollectionTab from "@/components/pages/media/MediaCollectionTab";

type MediaTabId = "collections" | `collection-${string}`;

interface OpenCollectionTab {
  collectionId: string;
  title?: string;
}

function toTabId(collectionId: string): MediaTabId {
  return `collection-${collectionId}`;
}

function fromTabId(tabId: MediaTabId): string | null {
  if (tabId === "collections") return null;
  return tabId.replace("collection-", "");
}

export default function MediaPage() {
  const navigate = useNavigate();
  const { collectionId } = useParams();

  const [openCollections, setOpenCollections] = useState<OpenCollectionTab[]>(
    [],
  );
  const [activeTab, setActiveTab] = useState<MediaTabId>("collections");

  const openCollection = (next: OpenCollectionTab) => {
    setOpenCollections((prev) => {
      const existing = prev.find((t) => t.collectionId === next.collectionId);
      if (existing) {
        return prev.map((t) =>
          t.collectionId === next.collectionId
            ? { ...t, title: next.title ?? t.title }
            : t,
        );
      }
      return [...prev, next];
    });

    const tabId = toTabId(next.collectionId);
    setActiveTab(tabId);
    navigate(`/app/media/${next.collectionId}`);
  };

  const closeCollection = (idToClose: string) => {
    setOpenCollections((prev) =>
      prev.filter((t) => t.collectionId !== idToClose),
    );

    // If closing active tab, fall back to collections.
    if (activeTab === toTabId(idToClose)) {
      setActiveTab("collections");
      navigate(`/app/media`);
    }
  };

  // If URL points at a collection, ensure it is open + active.
  useEffect(() => {
    if (!collectionId) {
      setActiveTab("collections");
      return;
    }

    const tabId = toTabId(collectionId);
    setActiveTab(tabId);
    setOpenCollections((prev) => {
      if (prev.some((t) => t.collectionId === collectionId)) return prev;
      return [...prev, { collectionId }];
    });
  }, [collectionId]);

  const tabs: Tab[] = useMemo(() => {
    const base: Tab[] = [
      {
        id: "collections",
        label: "Collections",
        icon: Library,
      },
    ];

    const dynamic: Tab[] = openCollections.map((t) => ({
      id: toTabId(t.collectionId),
      label: t.title || "Collection",
      closeable: true,
    }));

    return [...base, ...dynamic];
  }, [openCollections]);

  const handleTabChange = (tabId: string) => {
    const id = tabId as MediaTabId;
    setActiveTab(id);

    const collection = fromTabId(id);
    if (!collection) navigate(`/app/media`);
    else navigate(`/app/media/${collection}`);
  };

  const handleTabClose = (tabId: string) => {
    const id = tabId as MediaTabId;
    const collection = fromTabId(id);
    if (!collection) return;

    closeCollection(collection);
  };

  return (
    <AppLayout
      title="Media"
      description="Collections for all your media"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onTabClose={handleTabClose}
    >
      {activeTab === "collections" ? (
        <TabPanel id="collections-panel" tabId="collections-tab">
          <MediaCollectionsTab onOpenCollection={openCollection} />
        </TabPanel>
      ) : null}

      {openCollections.map((t) => {
        const tabId = toTabId(t.collectionId);
        if (activeTab !== tabId) return null;

        return (
          <TabPanel key={tabId} id={`${tabId}-panel`} tabId={`${tabId}-tab`}>
            <MediaCollectionTab
              collectionId={t.collectionId}
              onTitle={(title) =>
                setOpenCollections((prev) =>
                  prev.map((x) =>
                    x.collectionId === t.collectionId ? { ...x, title } : x,
                  ),
                )
              }
              onDeleted={() => closeCollection(t.collectionId)}
            />
          </TabPanel>
        );
      })}
    </AppLayout>
  );
}
