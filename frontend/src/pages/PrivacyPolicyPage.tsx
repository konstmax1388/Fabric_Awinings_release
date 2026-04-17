import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'

export function PrivacyPolicyPage() {
  return (
    <>
      <Helmet>
        <title>Политика конфиденциальности — Фабрика Тентов</title>
        <meta
          name="description"
          content="Политика конфиденциальности и согласие на обработку персональных данных."
        />
      </Helmet>
      <SiteHeader />
      <main className="mx-auto min-h-[60vh] w-full max-w-[960px] px-4 py-10 md:px-6 md:py-14">
        <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-sm text-text-muted">
          <Link to="/" className="hover:text-accent">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text">Политика конфиденциальности</span>
        </nav>

        <article className="mt-8 space-y-6 rounded-2xl border border-border-light bg-surface p-6 font-body text-sm leading-relaxed text-text md:p-8 md:text-base">
          <header className="space-y-2">
            <h1 className="font-heading text-2xl font-semibold text-text md:text-3xl">
              Политика конфиденциальности и согласие на обработку персональных данных
            </h1>
            <p className="text-text-muted">Редакция от 10 апреля 2026 г.</p>
          </header>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-text">1. Общие положения</h2>
            <p>
              Настоящая Политика определяет порядок обработки и защиты персональных данных пользователей сайта и
              сервисов, связанных с брендом «Фабрика Тентов» (далее - Сайт). Используя Сайт, вы подтверждаете, что
              ознакомились с настоящей Политикой.
            </p>
            <p>
              Оператор персональных данных: ИП Четверикова Лариса Юрьевна (ИНН 370207333295, ОГРНИП 326370000001370),
              далее - Оператор.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-text">2. Какие данные мы обрабатываем</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                имя или псевдоним, контактные данные (телефон, e-mail, ник в мессенджере), указанные в формах заявок
                и отзывов;
              </li>
              <li>технические данные: IP-адрес, тип браузера, время запроса, файлы cookie;</li>
              <li>содержание сообщений, отправленных через формы обратной связи;</li>
              <li>изображения, прикрепляемые к отзывам на Сайте (после модерации могут отображаться публично).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-text">3. Цели обработки</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>обработка заявок, консультаций, заказов;</li>
              <li>связь с пользователем по вопросам заказа и сервиса;</li>
              <li>публикация отзывов на Сайте (при отдельном согласии и после модерации);</li>
              <li>улучшение работы Сайта, аналитика (обезличенная) при использовании cookie;</li>
              <li>исполнение требований законодательства РФ.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-text">4. Правовые основания</h2>
            <p>
              Обработка осуществляется на основании согласия субъекта персональных данных (ст. 9 ФЗ-152), а также для
              исполнения договора, стороной которого является субъект, или для заключения договора по инициативе
              субъекта (п. 5 ч. 1 ст. 6 ФЗ-152), где это применимо.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-text">5. Cookie и аналогичные технологии</h2>
            <p>
              Сайт может использовать файлы cookie для сохранения настроек, работы корзины/сессии и аналитики. Вы
              можете отключить cookie в настройках браузера; часть функций Сайта при этом может стать недоступна.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-text">6. Передача третьим лицам</h2>
            <p>
              Данные могут передаваться хостинг-провайдерам, операторам связи, платежным и доставочным сервисам -
              только в объеме, необходимом для оказания услуг. Передача по запросу уполномоченных государственных
              органов - в случаях, предусмотренных законом.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-text">7. Срок хранения</h2>
            <p>
              Персональные данные хранятся не дольше, чем этого требуют цели обработки, если иной срок не установлен
              законом или договором. Заявки и переписка могут храниться в течение срока давности по
              гражданско-правовым спорам и налоговому учету.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-text">
              8. Права субъекта персональных данных
            </h2>
            <p>
              Вы вправе запросить уточнение, блокирование или удаление ваших персональных данных (с учетом
              обязательного хранения по закону), отозвать согласие, обратиться с жалобой в Роскомнадзор. Для
              реализации прав напишите на e-mail{' '}
              <a className="text-accent hover:underline" href="mailto:sale@fabrika-tentov.ru">
                sale@fabrika-tentov.ru
              </a>{' '}
              или через формы на Сайте с пометкой «Персональные данные».
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-text">
              9. Согласие на обработку персональных данных
            </h2>
            <p>
              Нажимая кнопки отправки форм на Сайте, проставляя отметки согласия (если предусмотрено интерфейсом) или
              направляя заявку иным способом, вы подтверждаете согласие на обработку указанных персональных данных в
              целях, указанных в п. 3 настоящей Политики, включая обработку с использованием средств автоматизации.
            </p>
            <p>
              Согласие на получение рекламных и информационных рассылок (если такая опция предлагается отдельно)
              дается только при явной отдельной отметке и может быть отозвано в любой момент.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-text">10. Изменения Политики</h2>
            <p>
              Оператор вправе обновлять Политику. Актуальная версия всегда доступна по адресу{' '}
              <Link to="/privacy" className="text-accent hover:underline">
                /privacy
              </Link>
              . Публичная оферта:{' '}
              <Link to="/offer" className="text-accent hover:underline">
                /offer
              </Link>
              .
            </p>
          </section>

          <section className="space-y-1 rounded-xl border border-border-light bg-bg-base p-4 text-sm text-text-muted">
            <p>Контакты оператора: +7 901 696 32 26, sale@fabrika-tentov.ru</p>
            <p>Адрес: 153550, Ивановская область, Кохма, улица Связи, 27.</p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  )
}
