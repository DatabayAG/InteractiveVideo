<?php
require_once 'Services/Export/classes/class.ilExportGUI.php';
/**
 * Class ilInteractiveVideoExportGUI
 */
class ilInteractiveVideoExportGUI extends ilExportGUI
{
	/**
	 * {@inheritdoc}
	 */
    protected function buildExportTableGUI(): ilExportTableGUI
	{
		/**
		 * @var $ilCtrl ilCtrl
		 * @var ilToolbarGUI $ilToolbar
		 */
		global $ilCtrl, $ilToolbar;
		$ilToolbar->addButton(
			ilInteractiveVideoPlugin::getInstance()->txt('export_all_comments'),
			$ilCtrl->getLinkTarget(new ilObjInteractiveVideoGUI(), 'exportAllComments')
		);
		require_once 'tables/class.ilInteractiveVideoExportTableGUI.php';
		$table = new ilInteractiveVideoExportTableGUI($this, 'listExportFiles', $this->obj);
		return $table;
	}

	/**
	 * Download file
	 */
    public function download(): void
	{
		if(isset($_GET['file']) && $_GET['file'])
		{
			$_POST['file'] = array($_GET['file']);
		}
		parent::download();
	}
}