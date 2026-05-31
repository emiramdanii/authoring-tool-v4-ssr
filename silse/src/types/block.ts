export interface BlockIcon {
  type: 'emoji' | 'image' | 'svg';
  value: string;
}

export interface Block {
  id: string;
  type: string;
  icon: BlockIcon | null;
  children?: Block[];
  properties?: Record<string, unknown>;
}

export interface CoverBlock extends Block {
  type: 'cover';
  properties: {
    title: string;
    subtitle?: string;
    backgroundImage?: string;
    icon?: BlockIcon;
  };
}

export interface PageBlock extends Block {
  type: 'page';
  properties: {
    title: string;
    icon?: BlockIcon;
  };
  children: Block[];
}
