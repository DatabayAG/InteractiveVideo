<?php

class ilInteractiveVideoLanguageHandler extends ilPluginLanguage
{
    /**
     * @param array|null $a_lang_keys
     * @return void
     */
    public function updateLanguages(?array $a_lang_keys = null): void
    {
        ilGlobalCache::flushAll();

        $rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(dirname(__FILE__) . '/../VideoSources'));
        $directories = $this->exploreDirectory($rii);
        $lang_array = [];
        $prefix = $this->getPrefix();
        foreach($directories as $dir)
        {
            $languages = $this->getAvailableLangFiles($dir);

            foreach($languages as $lang)
            {
                $txt = file($dir."/".$lang["file"]);
                if (is_array($txt))
                {
                    foreach ($txt as $row)
                    {
                        if ($row[0] != "#" && strpos($row, "#:#") > 0)
                        {
                            $a = explode("#:#",trim($row));
                            $lang_array[$lang["key"]][$prefix."_".trim($a[0])] = trim($a[1]);
                            ilObjLanguage::replaceLangEntry($prefix, $prefix."_".trim($a[0]), $lang["key"], trim($a[1]));
                        }
                    }
                }
            }
        }

        foreach($lang_array as $lang => $elements)
        {
            ilObjLanguage::replaceLangModule($lang, $prefix, $elements);
        }
    }

    /**
     * @param RecursiveIteratorIterator $rii
     * @return array
     */
    protected function exploreDirectory($rii)
    {
        $found_elements = [dirname(__FILE__) . '/../lang'];
        /** @var SplFileInfo $file */
        foreach($rii as $file)
        {
            if($file->isDir())
            {
                if(basename($file->getPath()) === 'lang')
                {
                    $found_elements[] = rtrim($file, ".");
                }
            }
        }
        return $found_elements;
    }
}