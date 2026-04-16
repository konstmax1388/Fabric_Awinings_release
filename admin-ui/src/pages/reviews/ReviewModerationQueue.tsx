import TaskAltIcon from '@mui/icons-material/TaskAlt'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { Button, Stack } from '@mui/material'
import {
  BooleanField,
  Datagrid,
  DateField,
  List,
  NumberField,
  SearchInput,
  TextField,
  useListContext,
  useNotify,
  useRefresh,
  useUnselectAll,
  useUpdateMany,
} from 'react-admin'

function ReviewModerationBulkActions() {
  const { selectedIds, data } = useListContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const unselectAll = useUnselectAll('reviews')
  const [updateMany, { isPending }] = useUpdateMany()

  const runModerateOnly = () => {
    if (!selectedIds.length) return
    updateMany(
      'reviews',
      { ids: selectedIds, data: { isModerated: true } },
      {
        onSuccess: (result) => {
          const count = Array.isArray(result) ? result.length : 0
          notify(`Подтверждено: ${count}`, { type: 'info' })
          unselectAll()
          refresh()
        },
        onError: () => notify('Не удалось подтвердить выбранные отзывы', { type: 'warning' }),
      },
    )
  }

  const runModerateAndPublish = () => {
    if (!selectedIds.length) return
    const rows = selectedIds
      .map((id) => data?.[id])
      .filter((x): x is { id: string | number; publicationConsent?: boolean } => Boolean(x))
    const allowedIds = rows.filter((x) => x.publicationConsent).map((x) => x.id)
    const skipped = rows.length - allowedIds.length
    if (!allowedIds.length) {
      notify('Нет отзывов с согласием на публикацию', { type: 'warning' })
      return
    }
    updateMany(
      'reviews',
      { ids: allowedIds, data: { isModerated: true, isPublished: true } },
      {
        onSuccess: (result) => {
          const count = Array.isArray(result) ? result.length : 0
          const msg =
            skipped > 0
              ? `Опубликовано: ${count}. Пропущено без согласия: ${skipped}`
              : `Опубликовано: ${count}`
          notify(msg, { type: skipped > 0 ? 'warning' : 'info' })
          unselectAll()
          refresh()
        },
        onError: () => notify('Не удалось опубликовать выбранные отзывы', { type: 'warning' }),
      },
    )
  }

  return (
    <Stack direction="row" spacing={1} sx={{ px: 1, py: 0.5 }}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<TaskAltIcon />}
        disabled={!selectedIds.length || isPending}
        onClick={runModerateOnly}
      >
        Подтвердить выбранные
      </Button>
      <Button
        size="small"
        variant="contained"
        startIcon={<VisibilityIcon />}
        disabled={!selectedIds.length || isPending}
        onClick={runModerateAndPublish}
      >
        Подтвердить и опубликовать
      </Button>
    </Stack>
  )
}

export default function ReviewModerationQueue() {
  return (
    <List
      resource="reviews"
      title="Очередь модерации отзывов"
      sort={{ field: 'createdAt', order: 'DESC' }}
      filter={{ isModerated: 'false', isPublished: 'false' }}
      filters={[<SearchInput source="search" alwaysOn key="q" />]}
    >
      <Datagrid rowClick="edit" bulkActionButtons={<ReviewModerationBulkActions />}>
        <TextField source="name" label="Имя" />
        <TextField source="city" label="Город" />
        <DateField source="reviewedOn" label="Дата отзыва" />
        <TextField source="rating" label="★" />
        <BooleanField source="publicationConsent" label="Согласие" />
        <BooleanField source="isModerated" label="Подтвержден" />
        <BooleanField source="isPublished" label="На сайте" />
        <NumberField source="sortOrder" label="Порядок" />
      </Datagrid>
    </List>
  )
}
