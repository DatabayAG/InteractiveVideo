<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

use ILIAS\UI\Component\Table\DataRetrieval;
use ILIAS\UI\Factory;
use ILIAS\UI\Renderer;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\RequestInterface;
use ILIAS\HTTP\Services;
use ILIAS\UI\Component\Table\DataRowBuilder;
use ILIAS\Data\Range;
use ILIAS\Data\Order;
use ILIAS\UI\Component\Table\Column\Column;
use ILIAS\UI\URLBuilder;
use ILIAS\UI\URLBuilderToken;

/**
 * Class SimpleChoiceQuestionsTableGUI
 * @author Nadia Ahmad <nahmad@databay.de>
 * @version $Id$
 */
class SimpleChoiceQuestionsTableGUI implements DataRetrieval
{
    private readonly Factory $factory;
    private readonly Renderer $renderer;
    private readonly \ILIAS\Refinery\Factory $refinery;
    private readonly ServerRequestInterface|RequestInterface $request;
    private readonly Services $http;
    private readonly int $parent_id;
    private readonly string $parent_type;
    private readonly ilLanguage $lng;
    private readonly ilGlobalTemplateInterface $tpl;

    private ?array $cached_records = null;
    private array $final_row;

    public function __construct(int $parent_obj_id, string $parent_obj_type, protected bool $has_write = false)
    {
        global $DIC;

        $this->lng = $DIC->language();
        $this->tpl = $DIC->ui()->mainTemplate();
        $this->factory = $DIC->ui()->factory();
        $this->renderer = $DIC->ui()->renderer();
        $this->refinery = $DIC->refinery();
        $this->request = $DIC->http()->request();
        $this->http = $DIC->http();

        $this->parent_id = $parent_obj_id;
        $this->parent_type = $parent_obj_type;
    }

    private function getRecords(): array
    {
        if ($this->cached_records !== null) {
            return $this->cached_records;
        }

        $rows = [];

        $simple = new SimpleChoiceQuestionStatistics();
        $rows = $simple->getScoreForAllQuestionsAndAllUser($this->parent_id);

        return $rows['users'];
    }

    public function getRows(
        DataRowBuilder $row_builder,
        array $visible_column_ids,
        Range $range,
        Order $order,
        ?array $filter_data,
        ?array $additional_parameters
    ): Generator {
        $records = $this->getRecords();

        if ($order) {
            [$order_field, $order_direction] = $order->join(
                [],
                fn($ret, $key, $value) => [$key, $value]
            );

            usort($records, static function (array $left, array $right) use ($order_field): int {

                if ($order_field === 'active') {
                    return $right[$order_field] <=> $left[$order_field];
                }

                return $left[$order_field] <=> $right[$order_field];
            });

            if ($order_direction === Order::DESC) {
                $records = array_reverse($records);
            }
        }

        if ($range) {
            $records = \array_slice($records, $range->getStart(), $range->getLength());
        }

        foreach ($records as $record) {
            yield $row_builder
                ->buildDataRow((string) $record['id'], $record);
        }
    }

    public function getTotalRowCount(
        ?array $filter_data,
        ?array $additional_parameters
    ): ?int {
        return \count($this->getRecords());
    }

    /**
     * @return array<string, Column>
     */
    private function getColumns(): array
    {
        return [
            'name' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('name')),
            'total' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('total')),
            'neutral_reflection' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('neutral_reflection')),
            'evaluable_questions' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('evaluable_questions')),
            'correct' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('correct_answer')),
            'wrong' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('wrong_answer')),
            'percentage_correct' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('percentage_correct')),
        ];
    }

    /**
     * @return array<string, \ILIAS\UI\Component\Table\Action\Action>
     */
    private function getActions(
        URLBuilder $url_builder,
        URLBuilderToken $action_parameter_token,
        URLBuilderToken $row_id_token,
    ): array {
        $this->has_write = true;
        return $this->has_write ? [
            'iv_remove_user_result' =>
                $this->factory->table()->action()->multi(
                    $this->lng->txt('delete'),
                    $url_builder->withParameter($action_parameter_token, 'iv_remove_user_result'),
                    $row_id_token
                )
        ] : [];
    }

    public function renderTable(): void
    {
        $df = new \ILIAS\Data\Factory();

        $table_uri = $df->uri($this->request->getUri()->__toString());
        $url_builder = new URLBuilder($table_uri);
        $query_params_namespace = ['tid'];

        [$url_builder, $action_parameter_token, $row_id_token] = $url_builder->acquireParameters(
            $query_params_namespace,
            'table_action',
            'id',
        );

        $table = $this->factory
            ->table()
            ->data(ilInteractiveVideoPlugin::getInstance()->txt('show_my_results'), $this->getColumns(), $this)
            ->withId(self::class . '_' . $this->parent_id)
            ->withOrder(new Order('title', Order::ASC))
            ->withActions($this->getActions($url_builder, $action_parameter_token, $row_id_token))
            ->withRequest($this->request);
        $out = [$table];

        $query = $this->http->wrapper()->query();

        $this->tpl->setContent($this->renderer->render($out));
    }
}
