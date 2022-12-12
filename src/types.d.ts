declare interface ItemImageUrls {
  original: string;
  xsmall: string;
  small: string;
  large: string;
  medium: string;
  xlarge: string;
  original_width: number;
  original_height: number;
}

declare interface Item {
  id: string;
  title: string;
  description: string;
  distance?: float;
  images: ItemImageUrls[];
  flags?: {
    pending: false;
    sold: false;
    reserved: false;
    banned: false;
    expired: false;
    onhold: false;
  };
  visibility_flags?: {
    bumped: false;
    highlighted: false;
    urgent: false;
    country_bumped: false;
    boosted: false;
  };
  price?: float;
  currency?: string;
  free_shipping?: boolean;
  web_slug?: string;
  shipping?: {
    item_is_shippable: true;
    user_allows_shipping: true;
    cost_configuration_id: null;
  };
  supports_shipping?: boolean;
  shipping_allowed?: boolean;
  seller_id?: string;
  creation_date?: number;
  modification_date?: number;
  location?: {
    city: string;
    postal_code: string;
    country_code: string;
  };
}
