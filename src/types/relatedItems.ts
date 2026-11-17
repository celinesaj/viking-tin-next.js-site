/** Matches API contract: product | bundle | special_offer */
export type RelatedResourceType = 'product' | 'bundle' | 'special_offer';

export type RelatedItemSourceSummary = {
  sourceType: RelatedResourceType;
  sourceId: string;
  name: string | null;
  imageUrl: string | null;
  relatedCount: number;
};

/** Nested `related` payload varies by relatedType; often camelCase-mapped entity or null. */
export type RelatedItemLink = {
  id: string;
  sourceType: RelatedResourceType;
  sourceId: string;
  relatedType: RelatedResourceType;
  relatedId: string;
  sortOrder: number;
  createdAt: string;
  related: unknown | null;
};

export type CreateRelatedItemBody = {
  source_type: RelatedResourceType;
  source_id: number;
  related_type: RelatedResourceType;
  related_id: number;
  sort_order?: number;
};
