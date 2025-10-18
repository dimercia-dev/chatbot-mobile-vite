import { Resend } from 'resend';

const resend = new Resend('re_Mm7uWUmR_Fo5ciyaNHWpyihCYGwrfEtd9');

async function testEmail() {
  try {
    console.log('🧪 Test d\'envoi d\'email avec le domaine dimerciadev.com...');
    
    const result = await resend.emails.send({
      from: 'Test <noreply@dimerciadev.com>', // ← ENLEVÉ "send."
      to: ['dimerciabusiness@gmail.com'],
      subject: '✅ Test domaine dimerciadev.com',
      html: `
        <h1>Félicitations ! 🎉</h1>
        <p>Votre domaine <strong>dimerciadev.com</strong> fonctionne parfaitement !</p>
        <p>Vous pouvez maintenant envoyer des emails avec votre propre domaine.</p>
      `
    });

    console.log('Résultat complet:', JSON.stringify(result, null, 2));

    if (result.error) {
      console.error('❌ Erreur détaillée:', result.error);
      return;
    }

    console.log('✅ Email envoyé avec succès !');
    console.log('📧 ID de l\'email:', result.data.id);
    console.log('\n👉 Vérifiez votre boîte de réception (et le dossier spam)');
    
  } catch (error) {
    console.error('❌ Exception complète:', error);
  }
}

testEmail();