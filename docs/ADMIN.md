# Page admin du menu

Adresse : **`/admin`** (ex. https://salade-bistrot.vercel.app/admin). Interface en français, pensée pour le téléphone.

## Ce qu'elle permet

- **Disponibilité du jour** : un interrupteur par article. Un article indisponible reste visible sur le site, grisé, et ne peut pas être choisi.
- **Modifier un article** (toucher son nom) : nom FR / AR, catégorie, groupe (toppings), supplément en MAD, ordre d'affichage, « selon disponibilité ».
- **Ajouter un article** : bouton en bas de l'écran. Un nouvel article peut emprunter le dessin d'un article proche en attendant sa photo.
- **Supprimer un article** (avec confirmation). Pour une absence temporaire, préférer « indisponible ».

Les changements apparaissent sur le site en quelques secondes (cache `menu` expiré à chaque enregistrement).

Les **formules** (prix, quantités incluses), le numéro WhatsApp et les suppléments base / ingrédient / topping restent dans le code (`src/lib/menu/data.ts`) pour l'instant.

## Connexion et sécurité

- Connexion par **lien e-mail** (Supabase Auth, pas de mot de passe).
- Seules les adresses de la table `public.admins` peuvent modifier : la base le vérifie elle-même (Row Level Security), pas seulement la page.
- Le site public lit le menu avec la clé publique (lecture seule).
- Si Supabase ne répond pas, le site affiche le menu intégré au code (`data.ts`).

### Ajouter un administrateur

Dans Supabase → SQL Editor :

```sql
insert into public.admins (email) values ('prenom@exemple.com');
```

## Configuration à faire une fois dans Supabase

Projet **Bistrot Salad Bar** → **Authentication → URL Configuration** :

1. **Site URL** : `https://salade-bistrot.vercel.app`
2. **Redirect URLs** : ajouter `https://salade-bistrot.vercel.app/admin/auth/callback`
   (et, pour les aperçus Vercel, `https://*.vercel.app/admin/auth/callback`).

Sans cette étape, le lien reçu par e-mail renvoie vers `localhost`.

L'envoi d'e-mails par défaut de Supabase est limité (quelques e-mails par heure) : suffisant pour un ou deux admins. Pour plus, configurer un SMTP dans Authentication → Emails.

## Technique

- Schéma : `supabase/migrations/20261102120000_menu_admin.sql`, `20261102121000_private_is_admin.sql` (appliquées).
- Lecture publique : `src/lib/menu/source.ts` (fetch REST, tag `menu`), fournie aux composants par `MenuProvider`.
- Admin : `src/app/admin/*` (pages, actions serveur), `src/components/admin/*` (interface).
- Variables d'environnement facultatives : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (valeurs publiques ; défauts dans `src/lib/supabase/config.ts`).
