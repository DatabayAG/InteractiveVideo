<?php
/**
 * Class ilInteractiveVideoSelectionExplorerGUI
 * @author Michael Jansen <mjansen@databay.de>
 */
class ilInteractiveVideoSelectionExplorerGUI extends ilRepositoryExplorerGUI
{
    protected string $id;

	/**
	 * @return string
	 */
    public function getId(): string
	{
		return $this->id;
	}

	/**
	 * @param $id
	 */
	public function setId($id): void
	{
		$this->id = __CLASS__ . '_' . $id;
	}

	/**
	 * {@inheritdoc}
	 */
	public function __construct($a_parent_obj, string $a_parent_cmd)
	{
		parent::__construct($a_parent_obj, $a_parent_cmd);
		$this->setTypeWhiteList(array());
		$this->setTypeBlackList(array('prg'));
	}

	/**
	 * {@inheritdoc}
	 */
    protected function isNodeSelectable($a_node): bool
	{
		return true;
	}

	/**
	 * {@inheritdoc}
	 */
    public function getNodeHref($a_node): string
	{
		return '#';
	}

}
