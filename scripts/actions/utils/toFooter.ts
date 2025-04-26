import { t } from '../../locales'
import { toHomepageShort } from '../../toUrl'

export const toFooter = function () {
  return '\n\n'
    + `> ${t('link.more-challenges')}${toHomepageShort()}\n`
}
