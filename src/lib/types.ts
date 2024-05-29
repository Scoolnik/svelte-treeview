export type Props = {
	nodeId: string;
	nodePath: string;
	hasChildren: string;
	useCallback: string;
	priority: string;
	dragDisabled: string;
	insertDisabled: string;
	nestAllowed: string;
	checkbox: string;
};

export type MappedNode = {
	id: NodeId;
	path: string;
	hasChildren: boolean;
	useCallback: boolean;
	priority: number;
	isDraggable: boolean;
	insertDisabled: boolean;
	nestDisabled: boolean;
	checkbox: boolean;
};

export type Node = {
	// TODO matbe use generics
	originalNode: any;
	id: NodeId;
	path: string;
	hasChildren: boolean;
	useCallback: boolean;
	priority: number;
	dragDisabled: boolean;
	insertDisabled: boolean;
	nestAllowed: boolean;
	checkbox: boolean;
	visualState: VisualState;
	expanded: boolean;
	selected: boolean;
	dropDisabled: boolean;
};

export enum VisualState {
	indeterminate = 'indeterminate',
	selected = 'true',
	notSelected = 'false'
}

export enum SelectionModes {
	all = 'all',
	perNode = 'perNode',
	none = 'none'
}

export type Tree = Node[];

export type NodeId = string | number;

export type CustomizableClasses = {
	treeClass: string;
	nodeClass: string;
	expandIcon: string;
	collapseIcon: string;
	nestIcon: string;
	expandClass: string;
	inserLineClass: string;
	currentlyDraggedClass: string;
};

export type DragEnterCallback = (draggendNode: Node, targetNode: Node) => Promise<boolean>;

export type BeforeMovedCallback = (
	draggendNode: Node,
	oldParent: Node,
	newParent: Node,
	insertionType: string
) => boolean;

export type ExpandedCallback = (node: Node) => Promise<void>;

export type HelperConfig = {
	separator: string;
};

export enum InsertionType {
	nest = 'nest',
	insertAbove = 'insert-above',
	insertBelow = 'insert-below',
	none = 'none'
}

export type TreeVisualStates = {
	[nodePath: string]: VisualState;
};

// unmapped values provided by the user
export type ProvidedTree = any[];

export type FilterFunction = (node: Node) => boolean;
