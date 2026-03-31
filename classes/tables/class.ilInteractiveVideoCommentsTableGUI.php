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
 * Class ilInteractiveVideoCommentsTableGUI
 */
class ilInteractiveVideoCommentsTableGUI implements DataRetrieval
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
    private readonly ilObjInteractiveVideo $object;

    public function __construct(int $parent_obj_id, string $parent_obj_type, ilObjInteractiveVideo $object, protected bool $has_write = false)
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
        $this->object = $object;
        $DIC->toolbar()->addButton(
            $object->txt('export_comments'),
            $DIC->ctrl()->getLinkTarget( new ilObjInteractiveVideoGUI(), 'exportMyComments'));

    }
    private function getRecords(): array
    {
        $rows = $this->object->getCommentsTableDataByUserId(true);
        return $rows;
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
                ->buildDataRow((string) $record['comment_id'], $record);
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
            'comment_time' => $this->factory->table()->column()->text($this->lng->txt('time')),
            'comment_time_end' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('time_end')),
            'title' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('long_title')),
            'comment_text' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('comment_table_title')),
            'is_private' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('visibility')),
            'is_reply_to' => $this->factory->table()->column()->text(ilInteractiveVideoPlugin::getInstance()->txt('is_reply_to')),
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
        return [
            'edit_comment' =>
                $this->factory->table()->action()->single(
                    ilInteractiveVideoPlugin::getInstance()->txt('edit_comment'),
                    $url_builder->withParameter($action_parameter_token, 'editMyComment'),
                    $row_id_token
                ),
            'delete_comment' =>
                $this->factory->table()->action()->multi(
                    ilInteractiveVideoPlugin::getInstance()->txt('delete'),
                    $url_builder->withParameter($action_parameter_token, 'deleteComment'),
                    $row_id_token
                )
        ];
    }

    public function renderTable($return = false): void
    {
        $df = new \ILIAS\Data\Factory();

        $table_uri = $df->uri($this->request->getUri()->__toString());
        $url_builder = new URLBuilder($table_uri);
        $query_params_namespace = ['tid'];

        [$url_builder, $action_parameter_token, $row_id_token] = $url_builder->acquireParameters(
            $query_params_namespace,
            'table_action',
            'comment_id',
        );

        $table = $this->factory
            ->table()
            ->data(ilInteractiveVideoPlugin::getInstance()->txt('my_comments'), $this->getColumns(), $this)
            ->withId(self::class . '_' . $this->parent_id)
            ->withOrder(new Order('title', Order::ASC))
            ->withActions($this->getActions($url_builder, $action_parameter_token, $row_id_token))
            ->withRequest($this->request);
        $out = [$table];

        $query = $this->http->wrapper()->query();

        $this->tpl->setContent($this->renderer->render($out));
    }

}
