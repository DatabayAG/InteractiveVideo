<?php

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
use ILIAS\Filesystem\Stream\Streams;

/**
 * Class SimpleChoiceQuestionsUserTableGUI
 * @version $Id$
 */
class SimpleChoiceQuestionsUserTableGUI implements DataRetrieval
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
        $simple = new SimpleChoiceQuestionScoring();
        $rows = $simple->getMyPointsNew($this->parent_id);
        $this->final_row = $rows[PHP_INT_MAX];
        unset($rows[PHP_INT_MAX]);
        $this->cached_records = $rows;

        return $rows;
    }

    public function getRows(
        DataRowBuilder $row_builder,
        array $visible_column_ids,
        Range $range,
        Order $order,
        mixed $additional_viewcontrol_data,
        mixed $filter_data,
        mixed $additional_parameters
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


        $id = $this->final_row['id'];
        $correct = $this->final_row['correct'];
        $overall = $this->final_row['overall'];
        if($overall > 0) {
            $result = floor(( $correct / $overall ) * 100) .'%';
        } else {
            $result = '-';
        }


        $records[] = [
            'id' => $id,
            'answered' => 999999999,
            'neutral_answer' => 999999999,
            'points_txt' => '<b>' . $result . '</b>',
            'title' => '<b>' . ilInteractiveVideoPlugin::getInstance()->txt('lp_summary') . '</b>',
            'type' => '<b>-</b>'
        ];

        foreach ($records as $record) {
            yield $row_builder
                ->buildDataRow((string) $record['id'], $record);
        }
    }

    public function getTotalRowCount(
        mixed $additional_viewcontrol_data,
        mixed $filter_data,
        mixed $additional_parameters
    ): ?int {
        return \count($this->getRecords());
    }

    /**
     * @return array<string, Column>
     */
    private function getColumns(): array
    {
        return [
            'comments_time' => $this->factory->table()->column()->text($this->lng->txt('time')),
            'title' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('question')),
            'type' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('question_type')),
            'points_txt' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('question_result')),
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
        return [];
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
            ->data($this, ilInteractiveVideoPlugin::getInstance()->txt('show_my_results'), $this->getColumns())
            ->withId(self::class . '_' . $this->parent_id)
            ->withOrder(new Order('title', Order::ASC))
            ->withActions($this->getActions($url_builder, $action_parameter_token, $row_id_token))
            ->withRequest($this->request);
        $out = [$table];

        $query = $this->http->wrapper()->query();

        $this->tpl->setContent($this->renderer->render($out));
    }
}
