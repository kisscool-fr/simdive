# Politique de sécurité

## Versions supportées

SimDive est une application web statique, sans backend ni collecte de données. Seule la dernière version de la branche `main`, déployée sur https://simdive.pages.dev, reçoit des correctifs de sécurité.

| Version                         | Supportée |
| ------------------------------- | --------- |
| `main` (dernière version)       | ✅        |
| Versions antérieures / forks    | ❌        |

## Signaler une vulnérabilité

Merci de **ne pas** signaler de vulnérabilité via une issue publique, une discussion ou une Pull Request.

Utilisez plutôt le [signalement privé de vulnérabilité de GitHub](https://github.com/kisscool-fr/simdive/security/advisories/new) (onglet **Security** → **Report a vulnerability**).

Dans votre signalement, indiquez si possible :

- une description de la vulnérabilité et de son impact potentiel ;
- les étapes pour la reproduire (ou une preuve de concept) ;
- la ou les versions / commits concernés ;
- une piste de correction, si vous en avez une.

## Ce à quoi vous attendre

SimDive est maintenu bénévolement, sur du temps libre. Nous nous efforçons de :

- accuser réception de votre signalement sous **7 jours** ;
- vous tenir informé de l'avancement de l'analyse et du correctif ;
- vous créditer dans l'avis de sécurité publié, si vous le souhaitez.

## Périmètre

Sont notamment dans le périmètre : le code de l'application (`web/`), ses dépendances, la configuration Docker et les workflows GitHub Actions.

⚠️ SimDive est un outil **exclusivement pédagogique**. Une erreur dans les calculs de décompression n'est pas une vulnérabilité de sécurité : merci de la signaler via une [issue classique](https://github.com/kisscool-fr/simdive/issues/new/choose).
