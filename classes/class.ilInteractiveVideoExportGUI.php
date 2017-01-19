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
	protected function buildExportTableGUI()
	{
		require_once 'class.ilInteractiveVideoExportTableGUI.php';
		$table = new ilInteractiveVideoExportTableGUI($this, 'listExportFiles', $this->obj);
		return $table;
	}

	/**
	 * Download file
	 */
	public function download()
	{
		if(isset($_GET['file']) && $_GET['file'])
		{
			$_POST['file'] = array($_GET['file']);
		}
		parent::download();
	}
}