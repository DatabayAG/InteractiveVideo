<?php
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
		$table = new ilInteractiveVideoExportTableGUI($this, 'listExportFiles', $this->obj);
		return $table;
	}

	/**
	 * Download file
	 */
    public function download(): void
	{
		
		parent::download();
	}
}
