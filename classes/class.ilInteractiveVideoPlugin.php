<?php
/**
 * Class ilInteractiveVideoPlugin
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilInteractiveVideoPlugin extends ilRepositoryObjectPlugin
{
	const CLASSIC_MODE = 0;
	const ADVENTURE_MODE = 1;
	const CTYPE = 'Services';
	const CNAME = 'Repository';
	const SLOT_ID = 'robj';
	const PNAME = 'InteractiveVideo';
    const PLUGIN_ID = 'xvid';

	private static ?ilInteractiveVideoPlugin $instance = null;

	/**
	 * @return ilInteractiveVideoPlugin
	 */
	public static function getInstance(): self
	{
        if (self::$instance instanceof self) {
            return self::$instance;
        }

        global $DIC;

        /** @var ilComponentFactory $component_factory */
        $component_factory = $DIC['component.factory'];

        /** @var self $plugin */
        $plugin = $component_factory->getPlugin(self::PLUGIN_ID);
        self::$instance = $plugin;

        return self::$instance;
	}

    public function getPluginName(): string
	{
		return self::PNAME;
	}

    protected function uninstallCustom(): void
    {
        global $DIC;
        $ilDB = $DIC->database();

        $drop_table_list = [
            'rep_robj_xvid_answers',
            'rep_robj_xvid_comments',
            'rep_robj_xvid_lp',
            'rep_robj_xvid_objects',
            'rep_robj_xvid_question',
            'rep_robj_xvid_qus_text',
            'rep_robj_xvid_score',
            'rep_robj_xvid_sources',
            'rep_robj_xvid_subtitle',
            'rep_robj_xvid_youtube',
            'rep_robj_xvid_surl',
            'rep_robj_xvid_mobs',
            'rep_robj_xvid_vimeo'
        ];

        $drop_sequence_list = [
            'rep_robj_xvid_comments',
            'rep_robj_xvid_question',
            'rep_robj_xvid_qus_text'
        ];

        foreach ($drop_table_list as $key => $table) {
            if ($ilDB->tableExists($table)) {
                $ilDB->dropTable($table);
            }
        }

        foreach ($drop_sequence_list as $key => $sequence) {
            if ($ilDB->sequenceExists($sequence)) {
                $ilDB->dropSequence($sequence);
            }
        }

        $ilDB->queryF('DELETE FROM il_wac_secure_path WHERE path = %s ',
            ['text'], ['xvid']);
    }

    protected function buildLanguageHandler(): ilPluginLanguage
    {
        return new ilInteractiveVideoLanguageHandler($this->getPluginInfo());
    }

    protected function getLanguageHandler(): ilPluginLanguage
    {
        if ($this->language_handler === null) {
            $this->language_handler = $this->buildLanguageHandler();
        }
        return $this->language_handler;
    }

    public function allowCopy(): bool
	{
		return true;
	}

    public static function stripSlashesWrapping(?string $a_str = null): string {
        if(is_null($a_str)) {
            return '';
        }
        return ilUtil::stripSlashes($a_str, true, '<a><br><i><u><s><strong><em><span><p><sub><sup>');
    }

    /**
     * Web-relative plugin path under public/ (for CSS/JS URLs).
     */
    public static function getWebAssetPath(string $path = ''): string
    {
        $base = rtrim(self::getInstance()->getRelativeDirectory(), '/');
        if ($path === '') {
            return $base . '/';
        }

        return $base . '/' . ltrim($path, '/');
    }

    /**
     * Absolute plugin directory for ilTemplate module paths.
     */
    public static function getTemplateModulePath(): string
    {
        return rtrim(self::getInstance()->getDirectory(), '/');
    }

    public static function _getIcon(string $a_type): string
    {
        return parent::_getIcon($a_type);
    }
}
