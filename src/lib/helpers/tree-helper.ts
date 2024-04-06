import orderBy from 'lodash.unionby'; // used by tree merge
import uniqueBy from 'lodash.uniqby'; // used by tree merge
import { SelectionHelper } from './selection-helpers.js';
import { DragAndDropHelper } from './drag-drop-helpers.js';
import type { Node, NodePath } from '$lib/types.js';
import type { PropertyHelper } from '$lib/helpers/property-helper.js';
export type HelperConfig = {
	separator?: string;
	recursive?: boolean;
};

export class TreeHelper {
	props: PropertyHelper;
	config: HelperConfig;
	selection: SelectionHelper;
	dragDrop: DragAndDropHelper;

	constructor(props: PropertyHelper, config = {}) {
		this.props = props;
		this.config = config;
		this.selection = new SelectionHelper(this);
		this.dragDrop = new DragAndDropHelper(this);
	}

	// replace with this.props.path
	path(node: Node | null): NodePath {
		return this.props.path(node);
	}

	//#region basic helpres

	getParentNodePath(nodePath: NodePath): NodePath {
		const separator = this.config.separator ?? '.';
		const parentPath = nodePath?.substring(0, nodePath.lastIndexOf(separator));
		return parentPath ?? null;
	}

	hasChildren(tree: Node[], nodePath: NodePath) {
		return tree?.find((x) => this.getParentNodePath(this.path(x)) === nodePath);
	}

	findNode(tree: Node[], nodePath: NodePath) {
		return tree.find((node) => this.path(node) === nodePath);
	}

	nodePathIsChild(nodePath: NodePath) {
		const separator = this.config.separator ?? '.';

		const includesSeparator = nodePath?.includes(separator);
		return includesSeparator;
	}

	getDirectChildren(tree: Node[], parentNodePath: NodePath) {
		const children = (tree || []).filter((x) =>
			!parentNodePath
				? !this.nodePathIsChild(this.path(x))
				: this.getParentNodePath(this.path(x)) === parentNodePath
		);

		return children;
	}

	allCHildren(tree: Node[], parentNodePath: NodePath) {
		const children = tree.filter((x) => {
			if (!parentNodePath) {
				//top level
				return !this.nodePathIsChild(this.path(x));
			} else {
				return (
					this.path(x)?.startsWith(parentNodePath.toString()) && this.path(x) != parentNodePath
				);
			}
		});
		return children;
	}

	getAllLeafNodes(tree: Node[]) {
		return tree.filter((x) => {
			return this.props.hasChildren(x) == undefined || this.props.hasChildren(x) == false;
		});
	}

	joinTrees(filteredTree: Node[], tree: Node[]) {
		return tree.map((tnode) => this.findNode(filteredTree, this.path(tnode)) || tnode);
	}

	mergeTrees(oldTree: Node[], addedTree: Node[], nodePath = 'nodePath') {
		return orderBy(addedTree, oldTree, nodePath);
	}

	/** toggles expansion on
	 */
	changeExpansion(tree: Node[], node: Node, changeTo: boolean) {
		const foundNode = this.findNode(tree, this.path(node));

		this.props.setExpanded(foundNode, changeTo);
	}

	/** changes expansion of every node that has this.hasChildren set to true
	 */
	changeEveryExpansion(tree: Node[], changeTo: boolean) {
		return tree.map((node) => {
			if (this.props.hasChildren(node) == true) {
				this.props.setExpanded(node, changeTo);
			}
			return node;
		});
	}

	/** changes expansion of every node that has this.hasChildren set to true if they are abose set level and expansion property isnt set
	 */
	expandToLevel(tree: Node[], level: number) {
		return tree.map((n) => {
			if (
				this.props.expanded(n) == undefined &&
				this.props.expanded(n) == null &&
				this.props.useCallback(n) != true &&
				this.getDepthLevel(this.path(n)) <= level
			) {
				this.props.setExpanded(n, true);
			}
			return n;
		});
	}

	//based on number of dots
	getDepthLevel(nodePath: NodePath) {
		if (nodePath == null) return 0;

		const separator = this.config.separator ?? '.';
		return nodePath.split(separator).length - 1;
	}

	//#endregion

	searchTree(tree: Node[], filter: (node: Node) => boolean, leafesOnly: boolean) {
		let filteredNodes;
		if (leafesOnly) {
			filteredNodes = this.getAllLeafNodes(tree).filter(filter);
		} else {
			console.log(tree);
			filteredNodes = tree.filter(filter);
		}

		const resultNodes: Node[] = [];

		//console.log("matching nodes length:" + matchingPathes.length)
		filteredNodes.forEach((node) => {
			resultNodes.push(node);

			const parentNodes = this.getParents(tree, node);
			resultNodes.push(...parentNodes);
		});

		const uniqueNodes = uniqueBy(resultNodes, (node) => this.path(node));

		return uniqueNodes;
	}

	getParents(tree: Node[], node: Node) {
		const parentsPaths: NodePath[] = [];

		let nodePath = this.path(node);

		// get all parents
		while (nodePath && nodePath.length > 0) {
			nodePath = this.getParentNodePath(nodePath);
			parentsPaths.push(nodePath);
		}

		//find nodes for given ids
		const parentNodes = tree.filter((n) =>
			parentsPaths.some((parentNodePath) => this.path(n) === parentNodePath)
		);

		return parentNodes;
	}
}
