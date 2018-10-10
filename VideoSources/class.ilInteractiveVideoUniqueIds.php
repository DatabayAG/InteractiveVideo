<?php

class ilInteractiveVideoUniqueIds
{

	const ROUNDS = 10;

	/**
	 * @var array
	 */
	protected $id_container = array();

	/**
	 * @var null | ilInteractiveVideoUniqueIds
	 */
	protected static $instance = null;

	/**
	 * @return ilInteractiveVideoUniqueIds
	 */
	public static function getInstance()
	{
		if (null !== self::$instance) {
			return self::$instance;
		}

		return (self::$instance = new self());
	}

	/**
	 * @return int|string
	 * @throws Exception
	 */
	public function getNewId()
	{
		$new_id = $this->generateUniqueId();
		return $new_id;
	}

	/**
	 * @return int|string
	 * @throws Exception
	 */
	protected function generateUniqueId()
	{
		$unique_id = '';
		for ($i = 0; $i <= self::ROUNDS; $i++) {
			$rand = 'iv_' . rand();
			if (!in_array($rand, $this->id_container)) {
				$this->id_container[$rand] = $rand;
				$unique_id                 = $rand;
				break;
			}
		}
		if ($unique_id === '') {
			throw new Exception('No unique id generated, this should not happen!');
		}
		return $unique_id;
	}

}