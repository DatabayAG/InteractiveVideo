<?php
/**
 * Class ilInteractiveVideoExportGUI
 */
class ilInteractiveVideoExportGUI extends ilExportGUI
{
    /**
     * {}
     * @throws ilCtrlException
     */
    public function buildExportTableGUI()
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
	}
}
