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
    private ilCtrlInterface $ctrl;

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
        $this->ctrl = $DIC->ctrl();

        $this->parent_id = $parent_obj_id;
        $this->parent_type = $parent_obj_type;
    }

    private function parsePercentageSortValue(mixed $value): float
    {
        if ($value === null || $value === '' || $value === '-') {
            return -1.0;
        }

        if (is_numeric($value)) {
            return (float) $value;
        }

        if (preg_match('/-?\d+(?:\.\d+)?/', (string) $value, $matches) === 1) {
            return (float) $matches[0];
        }

        return -1.0;
    }

    private function getNumericSortValue(mixed $value): float
    {
        if ($value === '-' || $value === null || $value === '') {
            return -1.0;
        }

        if (is_numeric($value)) {
            return (float) $value;
        }

        return -1.0;
    }

    private function parseLeadingNumber(mixed $value): float
    {
        if ($value === null || $value === '') {
            return -1.0;
        }

        if (is_numeric($value)) {
            return (float) $value;
        }

        if (preg_match('/-?\d+(?:\.\d+)?/', (string) $value, $matches) === 1) {
            return (float) $matches[0];
        }

        return -1.0;
    }

    private function getSortValue(array $record, string $order_field): string|float
    {
        return match ($order_field) {
            'total' => $record['total_sort'],
            'neutral_reflection' => $record['neutral_reflection_sort'],
            'evaluable_questions' => $record['evaluable_questions_sort'],
            'correct' => $record['correct_sort'],
            'wrong' => $record['wrong_sort'],
            'percentage_correct' => $record['percentage_correct_sort'],
            default => $record[$order_field] ?? '',
        };
    }

    private function compareRecords(array $left, array $right, string $order_field): int
    {
        $left_value = $this->getSortValue($left, $order_field);
        $right_value = $this->getSortValue($right, $order_field);

        if (is_float($left_value) || is_float($right_value) || is_int($left_value) || is_int($right_value)) {
            return $left_value <=> $right_value;
        }

        return strnatcasecmp((string) $left_value, (string) $right_value);
    }

    private function sortRecords(array $records, Order $order): array
    {
        [$order_field, $order_direction] = $order->join(
            [],
            fn($ret, $key, $value) => [$key, $value]
        );

        usort(
            $records,
            fn(array $left, array $right): int => $this->compareRecords($left, $right, $order_field)
        );

        if ($order_direction === Order::DESC) {
            $records = array_reverse($records);
        }

        return $records;
    }

    private function toDisplayRecord(array $record): array
    {
        return [
            'id' => $record['id'],
            'name' => $record['name'],
            'total' => $record['total_display'],
            'neutral_reflection' => $record['neutral_reflection_display'],
            'evaluable_questions' => $record['evaluable_questions_display'],
            'correct' => $record['correct_display'],
            'wrong' => $record['wrong_display'],
            'percentage_correct' => $record['percentage_correct_display'],
        ];
    }

    private function normalizeUserRecord(array $user): array
    {
        return [
            'id' => (string) ($user['id'] ?? ''),
            'name' => $user['name'] ?? '',
            'total_display' => is_scalar($user['total'] ?? null) ? (string) $user['total'] : '0',
            'total_sort' => $this->parseLeadingNumber($user['total'] ?? 0),
            'neutral_reflection_display' => (string) ($user['neutral_reflection'] ?? 0),
            'neutral_reflection_sort' => $this->getNumericSortValue($user['neutral_reflection'] ?? 0),
            'evaluable_questions_display' => (string) ($user['evaluable_questions'] ?? ''),
            'evaluable_questions_sort' => $this->parseLeadingNumber($user['evaluable_questions'] ?? 0),
            'correct_display' => is_scalar($user['correct'] ?? null) ? (string) $user['correct'] : '-',
            'correct_sort' => $this->getNumericSortValue($user['correct'] ?? '-'),
            'wrong_display' => is_scalar($user['wrong'] ?? null) ? (string) $user['wrong'] : '-',
            'wrong_sort' => $this->getNumericSortValue($user['wrong'] ?? '-'),
            'percentage_correct_display' => (string) ($user['percentage_correct'] ?? '0%'),
            'percentage_correct_sort' => $this->parsePercentageSortValue($user['percentage_correct'] ?? '0%'),
        ];
    }

    private function getRecords(): array
    {
        if ($this->cached_records !== null) {
            return $this->cached_records;
        }

        $simple = new SimpleChoiceQuestionStatistics();
        $data = $simple->getScoreForAllQuestionsAndAllUser($this->parent_id);
        $records = [];

        foreach ($data['users'] as $user) {
            $records[] = $this->normalizeUserRecord($user);
        }

        $this->cached_records = $records;

        return $records;
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
            $records = $this->sortRecords($records, $order);
        }

        if ($range) {
            $records = \array_slice($records, $range->getStart(), $range->getLength());
        }

        foreach ($records as $record) {
            yield $row_builder
                ->buildDataRow($record['id'], $this->toDisplayRecord($record));
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
            ->data($this, ilInteractiveVideoPlugin::getInstance()->txt('answered_questions'), $this->getColumns())
            ->withId(self::class . '_' . $this->parent_id)
            ->withOrder(new Order('name', Order::ASC))
            ->withActions($this->getActions($url_builder, $action_parameter_token, $row_id_token))
            ->withRequest($this->request);
        $out = [$table];

        $f = $this->factory;
        $renderer = $this->renderer;
        $action = $this->ctrl->getLinkTargetByClass(ilObjInteractiveVideoGUI::class, "completeCsvExport");
        $button = $renderer->render($f->button()->standard(ilInteractiveVideoPlugin::getInstance()->txt('csv_export'), $action));
        $this->tpl->setContent($button . '<p></p> ' . $this->renderer->render($out));
    }
}
