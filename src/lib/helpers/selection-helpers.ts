import type { PropertyHelper } from '$lib/helpers/property-helper.js';
import type { TreeHelper } from '$lib/helpers/tree-helper.js';
import { checkboxesTypes, type Node, type NodePath, type Tree, visualStates } from '$lib/types.js';

export class SelectionHelper {
	helper: TreeHelper;
	props: PropertyHelper;

	constructor(treeHelper: TreeHelper) {
		this.helper = treeHelper;
		this.props = treeHelper.props;
	}

	path(node: Node): NodePath {
		return this.helper.path(node);
	}
	selected(node: Node) {
		return this.props.selected(node);
	}

	getChildrenWithCheckboxes(tree: Tree, parentNodePath: string | null) {
		return this.helper
			.getDirectChildren(tree, parentNodePath)
			.filter((node: Node) => this.isSelectable(node, checkboxesTypes.all));
	}

	changeSelection(tree: Tree, nodePath: NodePath, filteredTree: Tree) {
		this.toggleSelected(tree, nodePath);

		const recursive = this.helper.config?.recursive ?? false;

		if (recursive) {
			tree = this.recomputeAllParentvisualStates(tree, filteredTree, nodePath);
		}

		return tree;
	}

	toggleSelected(tree: Tree, nodePath: NodePath) {
		const node = this.helper.findNode(tree, nodePath);

		this.props.setSelected(node, !this.selected(node));
	}

	changeSelectedForChildren(
		tree: Tree,
		parentNodePath: NodePath,
		changeTo: boolean,
		filteredTree: Tree
	) {
		tree = tree.map((node) => {
			//changes itself
			if (parentNodePath == this.path(node)) {
				this.updateLeafNodeSelection(node, changeTo);
			}

			if (!parentNodePath) {
				// TODO i think this isnt working
				// this only updates

				//top level
				this.updateLeafNodeSelection(node, changeTo);
			} else {
				//if parentNodePath isnt root
				if (
					this.path(node)?.startsWith(parentNodePath.toString()) &&
					this.path(node) != parentNodePath.toString()
				) {
					this.updateLeafNodeSelection(node, changeTo);
				}
			}
			return node;
		});

		tree = this.recomputeAllParentvisualStates(tree, filteredTree, parentNodePath);
		return tree;
	}

	//changes selected or visual state depending on
	updateLeafNodeSelection(node: Node, changeTo: boolean) {
		//dont change if not selectable
		if (!this.isSelectable(node, checkboxesTypes.all)) {
			return;
		}
		if (!this.props.hasChildren(node)) {
			this.props.setSelected(node, changeTo);
		} else {
			node.__visual_state = changeTo.toString();
		}
	}

	/**Calculates visual state based on children  */
	getVisualStates(filteredTree: Tree, node: Node) {
		const children = this.getChildrenWithCheckboxes(filteredTree, this.path(node));

		if (!children || children?.length == 0) return visualStates.notSelected;

		//if every child is selected or vs=true return true
		if (
			children.every(
				(x: Node) =>
					this.selected(x) === true || this.props.visualState(x) === visualStates.selected
			)
		) {
			return visualStates.selected;
		}
		//at least sone child is selected or indeterminate
		else if (
			children.some((x: Node) => {
				return (
					this.selected(x) === true ||
					x.__visual_state === visualStates.indeterminate ||
					x.__visual_state === visualStates.selected
				);
			})
		) {
			return visualStates.indeterminate;
		} else {
			return visualStates.notSelected;
		}
	}

	/** recursibly recomputes parent visual state until root */
	recomputeAllParentvisualStates(tree: Tree, filteredTree: Tree, nodePath: NodePath) {
		const parent = this.helper.getParentNodePath(nodePath);

		let newstate;
		filteredTree.forEach((x) => {
			if (this.path(x) == parent) {
				newstate = this.getVisualStates(filteredTree, x);
				x.__visual_state = newstate;
			}
		});
		if (this.helper.getParentNodePath(parent) != '') {
			tree = this.recomputeAllParentvisualStates(tree, filteredTree, parent);
		}
		return tree;
	}

	/** Computes visual states for all nodes. Used for computing initial visual states when tree changes  */
	computeInitialVisualStates(tree: Tree, filteredTree: Tree) {
		const rootELements = this.getChildrenWithCheckboxes(tree, null);
		rootELements.forEach((x: Node) => {
			if (this.props.hasChildren(x) == true) {
				tree = this.computeChildrenVisualStates(tree, filteredTree, x);
				x.__visual_state = this.getVisualStates(filteredTree, x);
			}
		});
		return tree;
	}
	/** Recursivly computes visual state for children  */
	computeChildrenVisualStates(tree: Tree, filteredTree: Tree, node: Node) {
		const directChildren = this.getChildrenWithCheckboxes(tree, this.path(node));

		//foreaches all children if it has children, it calls itself, then it computes __vs => will compute from childern to parent

		directChildren.forEach((child: Node) => {
			if (this.props.hasChildren(child) === true) {
				tree = this.computeChildrenVisualStates(tree, filteredTree, child);
				child.__visual_state = this.getVisualStates(filteredTree, child);
			}
		});
		return tree;
	}

	deleteSelected(tree: Tree) {
		return tree.map((node: Node) => {
			this.props.setSelected(node, false);
			node.__visual_state = undefined;
			return node;
		});
	}

	isSelectable(node: Node, showCheckboxes: checkboxesTypes) {
		if (showCheckboxes === checkboxesTypes.all) {
			return this.props.checkbox(node) !== false;
		}
		//show only if pop is true
		if (showCheckboxes === checkboxesTypes.perNode) {
			return this.props.checkbox(node) === true;
		}
		//dont show at all
		return false;
	}
}
